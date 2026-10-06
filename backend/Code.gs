const SHEET_EMPLOYEES = 'עובדים'
const SHEET_ATTENDANCE = 'נוכחות'
const SHEET_ABSENCES = 'היעדרויות'
const SESSION_TTL = 21600

function doGet(e) {
  return handle_(e?.parameter || {})
}

function handle_(params) {
  try {
    const action = String(params.action || '').trim()
    let result

    switch (action) {
      case 'test':
        result = {
          message: 'API is working',
        }
        break

      case 'login':
        result = login_(
          String(params.pin || '').trim(),
        )
        break

      case 'getTodayStatus':
        result = withSession_(
          params.session,
          () => ({
            status: getTodayStatus_(
              String(params.employeeId || '').trim(),
            ),
          }),
        )
        break

      case 'startWork':
        result = withSession_(
          params.session,
          () =>
            startWork_(
              String(params.employeeId || '').trim(),
            ),
        )
        break

      case 'endWork':
        result = withSession_(
          params.session,
          () =>
            endWork_(
              String(params.employeeId || '').trim(),
            ),
        )
        break

      case 'saveManual':
        result = withSession_(
          params.session,
          () =>
            saveManual_(
              String(params.employeeId || '').trim(),
              params,
            ),
        )
        break

      case 'saveAbsence':
        result = withSession_(
          params.session,
          () =>
            saveAbsence_(
              String(params.employeeId || '').trim(),
              params,
            ),
        )
        break

      case 'getHistory':
        result = withSession_(
          params.session,
          () => ({
            history: getHistory_(
              String(params.employeeId || '').trim(),
            ),
          }),
        )
        break

      default:
        throw new Error('UNKNOWN_ACTION')
    }

    return json_(
      {
        ok: true,
        ...(result || {}),
      },
      params.callback,
    )
  } catch (error) {
    return json_(
      {
        ok: false,
        error:
          error?.message || 'SERVER_ERROR',
      },
      params.callback,
    )
  }
}

function json_(object, callback) {
  const body = JSON.stringify(object)

  if (callback) {
    return ContentService.createTextOutput(
      `${callback}(${body});`,
    ).setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    )
  }

  return ContentService.createTextOutput(body).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function login_(pin) {
  const employee = findEmployeeByPin_(pin)

  if (!employee) {
    throw new Error('INVALID_PIN')
  }

  const token = Utilities.getUuid()

  CacheService.getScriptCache().put(
    `session_${token}`,
    employee.id,
    SESSION_TTL,
  )

  return {
    session: token,
    employeeId: employee.id,
    name: employee.name,
    language: employee.language || 'he',
    status: getTodayStatus_(employee.id),
  }
}

function findEmployeeByPin_(pin) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_EMPLOYEES)

  if (!sheet) {
    throw new Error('EMPLOYEES_SHEET_MISSING')
  }

  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return null
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 6)
    .getValues()

  for (const row of values) {
    const id = String(row[0] || '').trim()
    const name = String(row[1] || '').trim()
    const rowPin = String(row[2] || '').trim()
    const role = String(row[3] || '').trim()
    const language = String(row[4] || '').trim()
    const active = String(row[5] || '').trim()

    if (rowPin === pin && active !== 'לא') {
      return {
        id,
        name,
        role,
        language,
      }
    }
  }

  return null
}

function withSession_(token, callback) {
  const employeeId =
    CacheService.getScriptCache().get(
      `session_${String(token || '')}`,
    )

  if (!employeeId) {
    throw new Error('SESSION_EXPIRED')
  }

  return callback(employeeId)
}

function today_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd',
  )
}

function getTodayStatus_(employeeId) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_ATTENDANCE)

  if (!sheet) {
    throw new Error('ATTENDANCE_SHEET_MISSING')
  }

  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return {
      start: '',
      end: '',
      total: '',
    }
  }

  const rowsCount = Math.min(1000, lastRow - 1)
  const startRow = lastRow - rowsCount + 1
  const values = sheet
    .getRange(startRow, 2, rowsCount, 5)
    .getValues()

  const today = today_()

  for (let index = values.length - 1; index >= 0; index--) {
    const row = values[index]
    const employee = String(row[0] || '').trim()
    const date = String(row[1] || '').trim()

    if (employee === employeeId && date === today) {
      return {
        start: formatTime_(row[2]),
        end: formatTime_(row[3]),
        total: String(row[4] || ''),
      }
    }
  }

  return {
    start: '',
    end: '',
    total: '',
  }
}

function startWork_(employeeId) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_ATTENDANCE)

  const status = getTodayStatus_(employeeId)

  if (status.start) {
    throw new Error('ALREADY_STARTED')
  }

  sheet.appendRow([
    Utilities.getUuid(),
    employeeId,
    today_(),
    new Date(),
    '',
    '',
    'נוכחות',
    '',
  ])

  return {
    status: getTodayStatus_(employeeId),
  }
}

function endWork_(employeeId) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_ATTENDANCE)

  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    throw new Error('NO_START')
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 8)
    .getValues()

  const today = today_()

  for (let index = values.length - 1; index >= 0; index--) {
    const row = values[index]

    if (
      String(row[1] || '').trim() === employeeId &&
      String(row[2] || '').trim() === today &&
      row[3] &&
      !row[4]
    ) {
      const rowNumber = index + 2
      const start =
        row[3] instanceof Date
          ? row[3]
          : new Date(row[3])
      const end = new Date()

      const total =
        (end.getTime() - start.getTime()) /
        3600000

      sheet
        .getRange(rowNumber, 5)
        .setValue(end)

      sheet
        .getRange(rowNumber, 6)
        .setValue(total / 24)

      sheet
        .getRange(rowNumber, 6)
        .setNumberFormat('[h]:mm')

      return {
        status: getTodayStatus_(employeeId),
      }
    }
  }

  throw new Error('NO_OPEN_SHIFT')
}

function saveManual_(employeeId, params) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_ATTENDANCE)

  const start = parseTime_(params.start)
  const end = parseTime_(params.end)

  if (!params.date || !start || !end) {
    throw new Error('INVALID_MANUAL_DATA')
  }

  const total =
    (end.getTime() - start.getTime()) /
    3600000

  if (total < 0) {
    throw new Error('INVALID_TIME_RANGE')
  }

  sheet.appendRow([
    Utilities.getUuid(),
    employeeId,
    String(params.date),
    start,
    end,
    total / 24,
    'ידני',
    String(params.note || ''),
  ])

  sheet
    .getRange(sheet.getLastRow(), 6)
    .setNumberFormat('[h]:mm')

  return {
    saved: true,
  }
}

function saveAbsence_(employeeId, params) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_ABSENCES)

  if (!sheet) {
    throw new Error('ABSENCES_SHEET_MISSING')
  }

  if (!params.from || !params.to || !params.type) {
    throw new Error('INVALID_ABSENCE_DATA')
  }

  sheet.appendRow([
    Utilities.getUuid(),
    employeeId,
    String(params.type),
    String(params.from),
    String(params.to),
    String(params.note || ''),
    new Date(),
  ])

  return {
    saved: true,
  }
}

function getHistory_(employeeId) {
  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SHEET_ATTENDANCE)

  if (!sheet) {
    throw new Error('ATTENDANCE_SHEET_MISSING')
  }

  const lastRow = sheet.getLastRow()

  if (lastRow < 2) {
    return []
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 8)
    .getValues()

  return values
    .filter(
      (row) =>
        String(row[1] || '').trim() === employeeId,
    )
    .reverse()
    .slice(0, 100)
    .map((row) => ({
      id: String(row[0] || ''),
      date: String(row[2] || ''),
      start: formatTime_(row[3]),
      end: formatTime_(row[4]),
      total:
        row[5] instanceof Date
          ? formatDuration_(row[5])
          : String(row[5] || ''),
      reportType: String(row[6] || ''),
      note: String(row[7] || ''),
    }))
}

function formatTime_(value) {
  if (!value) {
    return ''
  }

  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      'HH:mm',
    )
  }

  return String(value)
}

function formatDuration_(value) {
  if (!(value instanceof Date)) {
    return String(value || '')
  }

  const hours = value.getHours()
  const minutes = value.getMinutes()

  return (
    String(hours).padStart(2, '0') +
    ':' +
    String(minutes).padStart(2, '0')
  )
}

function parseTime_(value) {
  if (!value) {
    return null
  }

  const parts = String(value).split(':').map(Number)

  if (
    parts.length !== 2 ||
    parts.some(Number.isNaN)
  ) {
    return null
  }

  const date = new Date()

  date.setHours(
    parts[0],
    parts[1],
    0,
    0,
  )

  return date
}
