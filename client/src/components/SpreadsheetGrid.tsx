import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Download, Upload } from 'lucide-react'

interface Cell {
  value: string
  style?: {
    bold?: boolean
    italic?: boolean
    backgroundColor?: string
    textAlign?: 'left' | 'center' | 'right'
  }
}

interface SpreadsheetGridProps {
  initialRows?: number
  initialCols?: number
  data?: Cell[][]
  onChange?: (data: Cell[][]) => void
}

export function SpreadsheetGrid({ 
  initialRows = 8, 
  initialCols = 8, 
  data: initialData,
  onChange 
}: SpreadsheetGridProps) {
  const [data, setData] = useState<Cell[][]>(() => {
    if (initialData) return initialData
    
    // Create empty grid
    const grid: Cell[][] = []
    for (let i = 0; i < initialRows; i++) {
      const row: Cell[] = []
      for (let j = 0; j < initialCols; j++) {
        row.push({ value: '' })
      }
      grid.push(row)
    }
    return grid
  })

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const updateCell = useCallback((row: number, col: number, value: string) => {
    const newData = [...data]
    if (!newData[row]) newData[row] = []
    if (!newData[row][col]) newData[row][col] = { value: '' }
    newData[row][col].value = value
    setData(newData)
    onChange?.(newData)
  }, [data, onChange])

  const addRow = useCallback(() => {
    const newRow: Cell[] = []
    const colCount = data[0]?.length || initialCols
    for (let i = 0; i < colCount; i++) {
      newRow.push({ value: '' })
    }
    const newData = [...data, newRow]
    setData(newData)
    onChange?.(newData)
  }, [data, initialCols, onChange])

  const addColumn = useCallback(() => {
    const newData = data.map(row => [...row, { value: '' }])
    if (newData.length === 0) {
      // If no rows exist, create first row with new column
      newData.push([{ value: '' }])
    }
    setData(newData)
    onChange?.(newData)
  }, [data, onChange])

  const removeRow = useCallback((rowIndex: number) => {
    if (data.length <= 1) return // Keep at least one row
    const newData = data.filter((_, index) => index !== rowIndex)
    setData(newData)
    onChange?.(newData)
  }, [data, onChange])

  const removeColumn = useCallback((colIndex: number) => {
    if (data[0]?.length <= 1) return // Keep at least one column
    const newData = data.map(row => row.filter((_, index) => index !== colIndex))
    setData(newData)
    onChange?.(newData)
  }, [data, onChange])

  const formatCell = useCallback((row: number, col: number, style: Partial<Cell['style']>) => {
    const newData = [...data]
    if (!newData[row]) newData[row] = []
    if (!newData[row][col]) newData[row][col] = { value: '' }
    newData[row][col].style = { ...newData[row][col].style, ...style }
    setData(newData)
    onChange?.(newData)
  }, [data, onChange])

  const colHeaders = useMemo(() => {
    const colCount = data[0]?.length || initialCols
    return Array.from({ length: colCount }, (_, i) => 
      String.fromCharCode(65 + (i % 26)) + (Math.floor(i / 26) > 0 ? Math.floor(i / 26) : '')
    )
  }, [data, initialCols])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={addRow} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Мөр нэмэх
        </Button>
        <Button onClick={addColumn} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Багана нэмэх
        </Button>
        
        {selectedCell && (
          <>
            <Button 
              onClick={() => removeRow(selectedCell.row)} 
              size="sm" 
              variant="destructive"
              disabled={data.length <= 1}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {selectedCell.row + 1}-р мөр устгах
            </Button>
            <Button 
              onClick={() => removeColumn(selectedCell.col)} 
              size="sm" 
              variant="destructive"
              disabled={data[0]?.length <= 1}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {colHeaders[selectedCell.col]} багана устгах
            </Button>
          </>
        )}
      </div>

      {/* Formatting Controls */}
      {selectedCell && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
          <Button
            variant={data[selectedCell.row]?.[selectedCell.col]?.style?.bold ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatCell(selectedCell.row, selectedCell.col, { 
              bold: !data[selectedCell.row]?.[selectedCell.col]?.style?.bold 
            })}
          >
            <strong>B</strong>
          </Button>
          <Button
            variant={data[selectedCell.row]?.[selectedCell.col]?.style?.italic ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatCell(selectedCell.row, selectedCell.col, { 
              italic: !data[selectedCell.row]?.[selectedCell.col]?.style?.italic 
            })}
          >
            <em>I</em>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatCell(selectedCell.row, selectedCell.col, { 
              textAlign: 'left' 
            })}
          >
            ⟵
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatCell(selectedCell.row, selectedCell.col, { 
              textAlign: 'center' 
            })}
          >
            ⟷
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatCell(selectedCell.row, selectedCell.col, { 
              textAlign: 'right' 
            })}
          >
            ⟶
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatCell(selectedCell.row, selectedCell.col, { 
              backgroundColor: '#fef3c7' 
            })}
          >
            🎨
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full border-collapse">
          {/* Column headers */}
          <thead>
            <tr>
              <th className="w-12 h-8 border bg-gray-100 text-xs font-medium"></th>
              {colHeaders.map((header, colIndex) => (
                <th 
                  key={colIndex}
                  className="min-w-[100px] h-8 border bg-gray-100 text-xs font-medium px-1"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Row header */}
                <td className="w-12 h-8 border bg-gray-100 text-xs font-medium text-center">
                  {rowIndex + 1}
                </td>
                {colHeaders.map((_, colIndex) => {
                  const cell = row[colIndex] || { value: '' }
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                  
                  return (
                    <td 
                      key={colIndex}
                      className={`border p-0 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: cell.style?.backgroundColor }}
                    >
                      <Input
                        value={cell.value}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                        className="border-0 h-8 text-xs px-1 rounded-none focus:ring-0"
                        style={{
                          fontWeight: cell.style?.bold ? 'bold' : 'normal',
                          fontStyle: cell.style?.italic ? 'italic' : 'normal',
                          textAlign: cell.style?.textAlign || 'left'
                        }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}