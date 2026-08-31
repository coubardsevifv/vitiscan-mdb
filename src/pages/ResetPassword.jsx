import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import { supabase } from "@/api/base44Client";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Lock, Loader2, AlertTriangle } from "lucide-react";

import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {

  // Supabase's password-recovery link redirects back here with the session

  // already established (see detectSessionInUrl in src/api/base44Client.js),

  // so there's no token to read from the query string — just check for a session.

  const [hasSession, setHasSession] = useState(null);

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session));

  }, []);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    if (newPassword !== confirmPassword) {

      setError("Les mots de passe ne correspondent pas");

      return;

    }

    setLoading(true);

    try {

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      window.location.href = "/login";

    } catch (err) {

      setError(err.message || "Failed to reset password");

    } finally {

      setLoading(false);

    }

  };

  if (hasSession === null) {

    return null;

  }

  if (!hasSession) {

    return (

      <AuthLayout

        icon={AlertTriangle}

        title="Lien de réinitialisation invalide"

        subtitle="Ce lien est incomplet ou invalide"

        footer={

          <Link to="/forgot-password" className="text-primary font-medium hover:underline">

            Request a new link

          </Link>

        }

      >

        <p className="text-sm text-foreground text-center">

          The link you used appears to be incomplete. Please request a new password reset email.

        </p>

      </AuthLayout>

    );

  }

  return (

    <AuthLayout

      icon={Lock}

      title="Nouveau mot de passe"

      subtitle="Saisissez votre nouveau mot de passe"

    >

      {error && (

        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">

          {error}

        </div>

      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="space-y-2">

          <Label htmlFor="password">Nouveau mot de passe</Label>

          <div className="relative">

            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />

            <Input

              id="password"

              type="password"

              autoComplete="new-password"

              autoFocus

              placeholder="••••••••"

              value={newPassword}

              onChange={(e) => setNewPassword(e.target.value)}

              className="pl-10 h-12"

              required

            />

          </div>

        </div>

        <div className="space-y-2">

          <Label htmlFor="confirm">Confirmer le mot de passe</Label>

          <div className="relative">

            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />

            <Input

              id="confirm"

              type="password"

              autoComplete="new-password"

              placeholder="••••••••"

              value={confirmPassword}

              onChange={(e) => setConfirmPassword(e.target.value)}

              className="pl-10 h-12"

              required

            />

          </div>

        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>

          {loading ? (

            <>

              <Loader2 className="w-4 h-4 mr-2 animate-spin" />

              Resetting...

            </>

          ) : (

            "Reset password"

          )}

        </Button>

      </form>

    </AuthLayout>

  );

}
