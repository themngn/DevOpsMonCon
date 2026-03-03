interface Props {
    total: number
    page: number
    limit: number
    onPageChange: (page: number) => void
  }
  
  export default function Pagination({ total, page, limit, onPageChange }: Props) {
    const totalPages = Math.ceil(total / limit)
  
    return (
      <div className="flex items-center justify-between mt-6 text-sm">
        <div>{total} total</div>
  
        <div className="flex items-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
  
          <span>
            Page {page} of {totalPages}
          </span>
  
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    )
  }