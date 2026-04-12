import { useSelector } from 'react-redux'

export function useAppSelector(selector) {
  return useSelector(selector)
}
