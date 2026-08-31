import React, { useState } from "react";

import { Link } from "react-router-dom";

import { supabase } from "@/api/base44Client";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";

import AuthLayout from "@/components/AuthLayout";

import { toast } from "@/components/ui/use-toast";

import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {

      setError("Les mots de passe ne correspondent pas");

      return;

    }

    setLoading(true);

    try {

      const { error } = await supabase.auth.signUp({

        email,

        password,

        options: { emailRedirectTo: `${window.location.origin}${safeReturnTo()}` },

      });

      if (error) throw error;

      setShowConfirm(true);

    } catch (err) {

      setError(err.message || "Registration failed");

    } finally {

      setLoading(false);

    }

  };

  const handleResend = async () => {

    setError("");

    try {

      const { error } = await supabase.auth.resend({ type: "signup", email });

      if (error) throw error;

      toast({

        title: "Email envoyé",

        description: "Consultez votre messagerie pour retrouver le lien de confirmation.",

      });

    } catch (err) {

      setError(err.message || "Failed to resend email");

    }

  };

  if (showConfirm) {

    return (

      <AuthLayout

        icon={Mail}

        title="Vérifiez votre adresse email"

        subtitle={`Un email de confirmation a été envoyé à ${email}`}

      >

        {error && (

          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">

            {error}

          </div>

        )}

        <p className="text-sm text-foreground text-center mb-6">

          Cliquez sur le lien reçu par email pour activer votre compte, puis connectez-vous.

        </p>

        <p className="text-center text-sm text-muted-foreground">

          Vous n’avez pas reçu l’email ?{" "}

          <button onClick={handleResend} className="text-primary font-medium hover:underline">

            Renvoyer

          </button>

        </p>

      </AuthLayout>

    );

  }

  return (

    <AuthLayout

      icon={UserPlus}

      title="Créer votre compte"

      subtitle="Inscrivez-vous pour commencer"

      footer={

        <>

          Vous avez déjà un compte ?{" "}

          <Link

            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}

            className="text-primary font-medium hover:underline"

          >

            Se connecter

          </Link>

        </>

      }

    >

      {error && (

        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">

          {error}

        </div>

      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="space-y-2">

          <Label htmlFor="email">Email</Label>

          <div className="relative">

            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />

            <Input

              id="email"

              type="email"

              autoComplete="email"

              autoFocus

              placeholder="you@example.com"

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              className="pl-10 h-12"

              required

            />

          </div>

        </div>

        <div className="space-y-2">

          <Label htmlFor="password">Mot de passe</Label>

          <div className="relative">

            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />

            <Input

              id="password"

              type="password"

              autoComplete="new-password"

              placeholder="••••••••"

              value={password}

              onChange={(e) => setPassword(e.target.value)}

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

              Création…

            </>

          ) : (

            "Créer le compte"

          )}

        </Button>

      </form>

    </AuthLayout>

  );

}
