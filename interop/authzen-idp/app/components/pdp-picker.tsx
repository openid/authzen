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
		<div className="flex  items-center gap-4 p-2 ">
			<div className="text-base">Policy Decision Point</div>
			<Select onValueChange={setPdp} defaultValue={activePdp}>
				<SelectTrigger className="min-w-[200px]">
					<SelectValue placeholder="Select a PDP" />
				</SelectTrigger>
				<SelectContent>
					{pdpList.map((pdp, i) => (
						<SelectItem key={`${pdp[i]}`} value={pdp}>
							{pdp}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
