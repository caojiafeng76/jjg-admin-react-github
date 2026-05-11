export interface PageTab {
  key: string
  href: string
  label: string
  closable: boolean
}

export interface PageLocation {
  pathname: string
  search: string
  hash: string
}

export function getLocationKey(location: PageLocation, homeKey: string | null) {
  if (location.pathname === '/' && homeKey) {
    return homeKey
  }

  return location.pathname
}
