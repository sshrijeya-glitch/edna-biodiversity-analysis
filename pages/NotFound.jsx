import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/ui/States'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto pt-10">
      <EmptyState
        icon={Compass}
        title="That page does not exist"
        description="The link may be out of date, or the sample it pointed to was never created."
        action={<Link to="/dashboard"><Button>Go to dashboard</Button></Link>}
      />
    </div>
  )
}
