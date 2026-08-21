import { Card, Eyebrow } from "@/components/ui";
import { getSelectedCountry } from "@/lib/location-server";
import { BecomeARiderForm } from "./become-a-rider-form";

export const metadata = { title: "Become a rider" };

const requirements = [
  "A valid ID and, for motorized deliveries, a driver's license",
  "A phone that can receive delivery notifications",
  "A bike, motorcycle, or vehicle suited to your area",
];

export default async function BecomeARiderPage() {
  const country = await getSelectedCountry();

  return (
    <div className="container-page flex flex-col gap-14 py-14 sm:py-20">
      <div className="flex max-w-2xl flex-col gap-4">
        <Eyebrow>Become a rider</Eyebrow>
        <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Deliver for WeeGive
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Riders pick up items from givers and deliver them to whoever
          claimed them, getting paid per delivery.
        </p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-foreground">What you&apos;ll need</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {requirements.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <BecomeARiderForm country={country} />
    </div>
  );
}
