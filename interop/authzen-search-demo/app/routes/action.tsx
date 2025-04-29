import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Route } from "./+types/action";
import { users } from "~/data/users.server";
import { records } from "~/data/records.server";
import { Form, useNavigation } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import SyntaxHighlighter from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { Code } from "lucide-react";
import { pdpCookie } from "~/cookies.server";
import { pdps } from "~/data/pdps.server";
import { actionResponse } from "~/lib/schema";

export function meta({}: Route.MetaArgs) {
  return [{ title: "AuthZEN Search API - Action Search" }];
}

export async function loader({}: Route.LoaderArgs) {
  return {
    users,
    records,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await pdpCookie.parse(cookieHeader)) || {};
  if (!cookie.selectedPdp) {
    return {
      error: "No PDP selected",
    };
  }
  const pdp = pdps.find((pdp) => pdp.name === cookie.selectedPdp);
  if (!pdp) {
    return {
      error: "PDP not found",
    };
  }
  const formData = await request.formData();
  const user = formData.get("user");
  const resource = formData.get("resource");
  const resourceId = formData.get("resourceId");
  if (!user || users.find((s) => s.id === user) === undefined) {
    return {
      error: "Invalid subject selected",
    };
  }
  const authZENRequest = {
    subject: {
      type: "user",
      id: user,
    },
    resource: {
      type: resource,
      id: resourceId,
    },
    context: {},
  };
  try {
    // make AuthZEN API call to get resources for the subject
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (pdp.headers) {
      Object.entries(pdp.headers).forEach(([key, value]) => {
        headers.append(key, value);
      });
    }
    const authZENResponse = await fetch(`${pdp.host}/access/v1/search/action`, {
      method: "POST",
      headers,
      body: JSON.stringify(authZENRequest),
    })
      .then((res) => res.json())
      .then((res) => actionResponse.parse(res));

    return {
      authZENRequest,
      authZENResponse,
    };
  } catch (error) {
    console.error("Error fetching data from PDP", error);
    return {
      error: "Error fetching data from PDP",
    };
  }
}

export default function ActionSearch({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Search</CardTitle>
        <CardDescription>
          Select a subject and resource to get the possible actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" className="flex flex-col gap-4">
          <div className="mb-6 flex gap-4 items-center">
            <p className="font-semibold text-sm">Subject</p>
            <Select name="user" defaultValue={loaderData.users[0].id}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {loaderData.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="font-semibold text-sm">Resource type</p>
            <Select name="resource" defaultValue="record">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select an resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="record">record</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="resource" value="record" />
            <p className="font-semibold text-sm">Resource ID</p>
            <Select
              name="resourceId"
              defaultValue={loaderData.records[0].id + ""}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a record" />
              </SelectTrigger>
              <SelectContent>
                {loaderData.records.map((record) => (
                  <SelectItem key={record.id} value={record.id + ""}>
                    {record.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type={"submit"}
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Evaluating..." : "Evaluate"}
            </Button>
          </div>

          {actionData?.error && (
            <>
              <div className="text-red-500 mb-4">{actionData.error}</div>
            </>
          )}

          {actionData?.authZENResponse && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionData.authZENResponse.results?.map((action) => (
                      <TableRow key={action}>
                        <TableCell className="font-medium">{action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <Card className="bg-muted/40">
                  <CardHeader>
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      <CardTitle>Request View</CardTitle>
                    </div>
                    <CardDescription>API request and response</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="request">
                      <TabsList className="mb-4">
                        <TabsTrigger value="request">Request</TabsTrigger>
                        <TabsTrigger value="response">Response</TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="request"
                        className="gap-2 flex flex-col"
                      >
                        <SyntaxHighlighter
                          language="bash"
                          style={vscDarkPlus}
                          className="p-4 rounded-md overflow-auto text-sm"
                          wrapLines={true}
                          customStyle={{ margin: 0, background: "black" }}
                        >
                          POST /access/v1/resources
                        </SyntaxHighlighter>
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          className="p-4 rounded-md overflow-auto text-sm"
                          wrapLines={true}
                          customStyle={{ margin: 0, background: "black" }}
                        >
                          {JSON.stringify(actionData.authZENRequest, null, 2)}
                        </SyntaxHighlighter>
                      </TabsContent>
                      <TabsContent value="response">
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          className="p-4 rounded-md overflow-auto text-sm"
                          wrapLines={true}
                          customStyle={{ margin: 0, background: "black" }}
                        >
                          {JSON.stringify(actionData.authZENResponse, null, 2)}
                        </SyntaxHighlighter>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}
