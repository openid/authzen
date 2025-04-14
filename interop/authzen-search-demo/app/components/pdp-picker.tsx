import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface PDPPickerProps {
  pdpList: string[];
  activePdp: string;
  setPdp: (pdp: string) => void;
}

export function PDPPicker({ pdpList, activePdp, setPdp }: PDPPickerProps) {
  return (
    <div className="flex w-full items-center gap-4 p-2 bg-sidebar-primary-foreground border-b border-b-border">
      <div className="text-base">Policy Decision Point</div>
      <Select onValueChange={setPdp} defaultValue={activePdp}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a PDP" />
        </SelectTrigger>
        <SelectContent>
          {pdpList.map((pdp, i) => (
            <SelectItem key={i} value={pdp}>
              {pdp}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
