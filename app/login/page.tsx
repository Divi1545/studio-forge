import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">
            Studio<span className="text-primary">Forge</span>
          </CardTitle>
          <CardDescription>Private AI creative studio. Admin access only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoFocus />
            </div>
            {error ? (
              <p className="text-sm text-destructive">Incorrect password. Try again.</p>
            ) : null}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
