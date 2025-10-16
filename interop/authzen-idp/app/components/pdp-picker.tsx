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
	disabled?: boolean;
}

export function PDPPicker({
	pdpList,
	activePdp,
	setPdp,
	disabled = false,
}: PDPPickerProps) {
	const handleValueChange = (value: string) => {
		if (!disabled) {
			setPdp(value);
		}
	};

	return (
		<div className="flex items-center gap-4 p-2">
			<div className="text-base">Policy Decision Point</div>
			<Select onValueChange={handleValueChange} value={activePdp}>
				<SelectTrigger className="min-w-[200px]" disabled={disabled}>
					<SelectValue placeholder="Select a PDP" />
				</SelectTrigger>
				<SelectContent>
					{pdpList.map((pdp) => (
						<SelectItem key={pdp} value={pdp}>
							{pdp}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
