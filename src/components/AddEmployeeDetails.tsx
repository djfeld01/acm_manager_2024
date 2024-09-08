"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserDetails, insertUserDetailsSchema } from "@/db/schema/user";
import { useToast } from "./ui/use-toast";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { insertUserDetails } from "@/lib/controllers/userController";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
export default function AddEmployeeDetails(): JSX.Element {
  const { toast } = useToast();
  const defaultValues = {
    email: "",
    firstName: "",
    lastName: "",
    paycorEmployeeId: undefined,
    sitelinkEmployeeId: undefined,
  };
  const form = useForm<CreateUserDetails>({
    resolver: zodResolver(insertUserDetailsSchema),
    defaultValues,
  });
  console.log("This is a thing: ", form.formState.errors);
  async function onSubmit(values: CreateUserDetails) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
    try {
      const response = await insertUserDetails(values);
      toast({
        title: "Database Response",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">
              {JSON.stringify(response, null, 2)}
            </code>
          </pre>
        ),
      });
      form.reset(defaultValues);
    } catch (error) {
      // Handle the error
      if (error) {
        const err = error as Error;
        toast({
          title: "Error",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{err.message}</code>
            </pre>
          ),
        });
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Add Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />{" "}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />{" "}
            <FormField
              control={form.control}
              name="paycorEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paycor ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Paycor Employee Id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />{" "}
            <FormField
              control={form.control}
              name="sitelinkEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitelink Employee Id</FormLabel>
                  <FormControl>
                    <Input placeholder="Sitelink Employee Id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
