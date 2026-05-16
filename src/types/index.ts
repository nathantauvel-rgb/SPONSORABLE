export type Platform = {
  id: string
  name: string
  color: string
  hero: boolean
  mainStat: { value: string; label: string }
  secondaryStats: { value: string; label: string }[]
}

export type Partnership = {
  name: string
  category: string
  result: string
  date: string
}
