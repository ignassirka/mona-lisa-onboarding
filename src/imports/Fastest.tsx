import fastestNlUrl from "../app/assets/fastest-nl.png";

export default function Fastest() {
  return (
    <div className="relative size-full" data-name="Fastest">
      <img
        src={fastestNlUrl}
        alt=""
        className="absolute block size-full rounded-[4px] object-cover"
      />
    </div>
  );
}
