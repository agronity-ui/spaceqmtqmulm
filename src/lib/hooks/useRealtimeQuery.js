import { useCallback, useEffect, useState } from 'react'
import { subscribeTable } from '../supabase'

export function useRealtimeQuery(loader, deps = [], tableNames = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await loader()
      setData(result || [])
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    const unsubs = tableNames.map(t => subscribeTable(t, () => reload()))
    return () => unsubs.forEach(fn => fn())
  }, [reload, tableNames.join('|')])

  return { data, setData, loading, error, reload }
}
