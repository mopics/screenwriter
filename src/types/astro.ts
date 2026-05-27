export type ChartBody = {
  name: string
  longitude: number
  sign: string
  signDegree: number
  retrograde: boolean
}

export type AstroChartParams = {
  day: number
  month: number
  year: number
  time: number
  lat: number
  lon: number
}
