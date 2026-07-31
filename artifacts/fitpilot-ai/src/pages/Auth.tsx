import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Activity,
  ArrowRight,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/supabase-auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Enter your name").optional(),
});

export function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const { signIn, signUp } = useSupabaseAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  async function submit(values: z.infer<typeof schema>) {
    console.log("STEP 1 - submit called", values);
    console.log("SUPABASE URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("ANON KEY EXISTS =", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log("ORIGIN =", window.location.origin);

    try {
      if (mode === "signin") {
        console.log("STEP 2 - before signIn");

        const result = await signIn({
          email: values.email,
          password: values.password,
        });

        console.log("STEP 3 - signIn success", result);

        toast({
          title: "Welcome back",
        });
      } else {
        console.log("STEP 2 - before signUp");

        const result = await signUp(
          {
            email: values.email,
            password: values.password,
          },
          values.fullName || ""
        );

        console.log("STEP 3 - signUp success", result);

        if (!result.session) {
          toast({
            title: "Confirm your email",
            description:
              "Check your inbox to finish creating your account.",
          });
        } else {
          toast({
            title: "Account created",
          });
        }
      }
    } catch (error) {
      console.error("STEP 4 - auth error", error);

      toast({
        title: "Authentication failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">
            FitPilot<span className="text-primary">AI</span>
          </span>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle>
              {mode === "signin"
                ? "Sign in to your gym"
                : "Create your gym account"}
            </CardTitle>

            <CardDescription>
              {mode === "signin"
                ? "Use your Supabase account to continue."
                : "Your gym workspace starts with your account."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
  onSubmit={(e) => {
    e.preventDefault();
    console.log("FORM SUBMITTED");
    submit(form.getValues());
  }}
  className="space-y-4"
>
                {mode === "signup" && (
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>

                        <FormControl>
                          <div className="relative">
                            <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                            <Input
                              className="pl-9"
                              placeholder="Alex Johnson"
                              {...field}
                            />
                          </div>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>

                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                          <Input
                            type="email"
                            className="pl-9"
                            placeholder="you@gym.com"
                            {...field}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>

                      <FormControl>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                          <Input
                            type="password"
                            className="pl-9"
                            placeholder="At least 8 characters"
                            {...field}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Working..."
                    : mode === "signin"
                    ? "Sign in"
                    : "Create account"}

                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </Form>

            <button
              type="button"
              className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                form.reset();
              }}
            >
              {mode === "signin"
                ? "New to FitPilot? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
