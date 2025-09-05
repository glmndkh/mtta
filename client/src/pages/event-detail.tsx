import { useParams } from 'wouter';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold'>Event Detail</h1>
      {id && <p>Event ID: {id}</p>}
    </div>
  );
}

