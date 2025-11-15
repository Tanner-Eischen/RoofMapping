import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <main className="py-12">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Precision Roof Measurement</h1>
          <p className="mt-3 text-slate-700">Analyze roofs in minutes with satellite imagery, LiDAR, and guided capture.</p>
          <div className="mt-6 flex gap-3">
            <Button href="/address">Start Analysis</Button>
            <Button variant="outline" href="/results">View Results</Button>
          </div>
        </div>
        <Card>
          <CardContent>
            <div className="aspect-video w-full rounded bg-sage-100 grid place-items-center text-sage-700">Satellite preview</div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}