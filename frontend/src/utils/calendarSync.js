/**
 * calendarSync.js — Utility untuk sinkronisasi jadwal pemotretan ke Google Calendar & iCalendar (.ics)
 * Membantu fotografer dan klien agar tidak terlewat jadwal pemotretan.
 */

/**
 * Format tanggal dan waktu menjadi format ISO basic (YYYYMMDDTHHmmssZ) untuk kalender
 */
function formatToCalTime(dateStr, timeStr, durationHours = 2) {
  // dateStr format: YYYY-MM-DD
  // timeStr format: HH:mm atau HH:mm:ss
  const time = (timeStr || '09:00').substring(0, 5)
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  const startDate = new Date(year, month - 1, day, hour, minute)
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000)

  const pad = (n) => String(n).padStart(2, '0')

  const toBasic = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

  return {
    start: toBasic(startDate),
    end: toBasic(endDate),
    startDate,
    endDate,
  }
}

/**
 * Buat tautan langsung ke Google Calendar web
 */
export function createGoogleCalendarUrl({
  title,
  description = '',
  location = '',
  date,
  time,
  durationHours = 2,
}) {
  const { start, end } = formatToCalTime(date, time, durationHours)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location: location,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Buat dan unduh berkas .ics (iCalendar) standar untuk Apple Calendar / Outlook / Android
 */
export function downloadIcsFile({
  title,
  description = '',
  location = '',
  date,
  time,
  durationHours = 2,
  filename = 'jadwal-sesi-foto.ics',
}) {
  const { start, end } = formatToCalTime(date, time, durationHours)
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`
  const uid = `rb-${Date.now()}@ruangbahagia.com`

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ruang Bahagia//Jadwal Sesi Foto//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/[,;]/g, ' ')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat H-1 Sesi Foto',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
