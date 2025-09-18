import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { type AuditEntry, AuditType } from "~/lib/auditLog";

interface AuditLogProps {
	entries: AuditEntry[];
}

export function AuditLog({ entries }: AuditLogProps) {
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "medium",
	});

	return (
		<>
			{entries.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					Audit events will appear here once activity is recorded.
				</p>
			) : (
				<ScrollArea className="max-h-[50rem]">
					<div className="space-y-2">
						{entries.map((entry, index) => {
							const timestamp = new Date(entry.timestamp);
							const formattedTimestamp = Number.isNaN(timestamp.getTime())
								? String(entry.timestamp)
								: dateFormatter.format(timestamp);
							const typeLabel =
								entry.type === AuditType.AuthN
									? "Authentication"
									: "Authorization";

							return (
								<div
									key={`${String(entry.timestamp)}-${index}`}
									className="rounded-md border bg-card p-2 shadow-sm"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="space-y-2">
											<p className="text-xs text-muted-foreground">
												{formattedTimestamp}
											</p>
											{entry.type === AuditType.AuthN && "idp" in entry.body ? (
												<div className="space-y-1">
													<p className="text-xs font-medium text-foreground">
														{entry.body.idp}
													</p>
													<p className="text-xs text-muted-foreground">
														{entry.body.message}
													</p>
													{entry.body.response ? (
														<div className="mt-3 grid gap-3 text-xs">
															<div>
																<p className="font-medium uppercase tracking-wide text-foreground">
																	Response
																</p>
																<pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-tight">
																	{JSON.stringify(entry.body.response, null, 2)}
																</pre>
															</div>
														</div>
													) : null}
												</div>
											) : null}
											{entry.type === AuditType.AuthZ &&
											"endpoint" in entry.body ? (
												<div className="space-y-1">
													<p className="text-sm font-medium text-foreground">
														{entry.body.endpoint}
													</p>
													<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
														<span>PDP {entry.body.pdpId}</span>
														<span>•</span>
														<Badge
															variant={
																entry.body.ok ? "secondary" : "destructive"
															}
															className="uppercase tracking-wide"
														>
															{entry.body.ok ? "Allowed" : "Denied"}
														</Badge>
													</div>
												</div>
											) : null}
										</div>
										<Badge variant="outline">{typeLabel}</Badge>
									</div>
									{entry.type === AuditType.AuthZ && "payload" in entry.body ? (
										<div className="mt-3 grid gap-3 text-xs">
											<div>
												<p className="font-medium uppercase tracking-wide text-foreground">
													Request
												</p>
												<pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-tight">
													{JSON.stringify(entry.body.payload, null, 2)}
												</pre>
											</div>
											{entry.body.response ? (
												<div>
													<p className="font-medium uppercase tracking-wide text-foreground">
														Response
													</p>
													<pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-tight">
														{JSON.stringify(entry.body.response, null, 2)}
													</pre>
												</div>
											) : null}
										</div>
									) : null}
								</div>
							);
						})}
					</div>
				</ScrollArea>
			)}
		</>
	);
}
