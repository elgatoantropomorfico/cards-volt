"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Share2,
  Phone,
  Palette,
  Eye,
  ShieldCheck,
  Loader2,
  QrCode,
  Save,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { PhonePreview } from "@/components/dashboard/PhonePreview";
import { TEMPLATE_CATALOG } from "@/lib/templates-meta";
import { normalizeSlug, isValidSlug } from "@/lib/utils";
import {
  autosaveOnboarding,
  addOnboardingLink,
  deleteOnboardingLink,
  finalizeOnboarding,
} from "@/server/onboarding-actions";
import type { ProfileView, ProfileLink, LinkKind } from "@/lib/profile-types";

const STEPS = [
  { num: 1, title: "Identidad", desc: "Foto, nombre y cargo" },
  { num: 2, title: "Tu URL", desc: "Enlace personalizado" },
  { num: 3, title: "Contacto", desc: "WhatsApp, email y tel" },
  { num: 4, title: "Redes y Links", desc: "Instagram, LinkedIn, web" },
  { num: 5, title: "Diseño", desc: "Plantilla y colores" },
  { num: 6, title: "Vista Previa", desc: "Revisá tu perfil final" },
  { num: 7, title: "Confirmación", desc: "Enviar a producción" },
];

const PRESETS = [
  "#7C3AED",
  "#0F172A",
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#E11D48",
  "#C9A227",
];

export function OnboardingWizard({
  order,
  initialProfile,
  initialLinks,
  appHost,
}: {
  order: {
    id: string;
    orderNumber: string;
    profileStatus: string;
    fulfillmentStatus: string;
  };
  initialProfile: ProfileView;
  initialLinks: ProfileLink[];
  appHost: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialProfile.onboardingStep || 1);
  const [profile, setProfile] = useState<ProfileView>(initialProfile);
  const [links, setLinks] = useState<ProfileLink[]>(initialLinks);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(initialProfile.profileStatus === "READY");

  // Links temp inputs
  const [newKind, setNewKind] = useState<LinkKind>("INSTAGRAM");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);

  // Autosave con debounce al modificar profile
  const saveTimeoutRef = useRef<any>(null);

  const triggerAutosave = (updatedProfile: ProfileView, currentStepNum: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await autosaveOnboarding({
        orderId: order.id,
        profileId: updatedProfile.id,
        currentStep: currentStepNum,
        fullName: updatedProfile.fullName,
        jobTitle: updatedProfile.jobTitle,
        companyName: updatedProfile.companyName,
        description: updatedProfile.description,
        avatarUrl: updatedProfile.avatarUrl,
        slug: updatedProfile.slug,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        whatsapp: updatedProfile.whatsapp,
        website: updatedProfile.website,
        location: updatedProfile.location,
        instagram: updatedProfile.instagram,
        linkedin: updatedProfile.linkedin,
        twitter: updatedProfile.twitter,
        tiktok: updatedProfile.tiktok,
        youtube: updatedProfile.youtube,
        github: updatedProfile.github,
        template: updatedProfile.template,
        primaryColor: updatedProfile.primaryColor,
        themeMode: updatedProfile.themeMode,
        coverUrl: updatedProfile.coverUrl,
      });
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }, 600);
  };

  const updateProfileState = (patch: Partial<ProfileView>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      triggerAutosave(next, step);
      return next;
    });
  };

  const handleNextStep = () => {
    if (step < 7) {
      const nextStep = step + 1;
      setStep(nextStep);
      triggerAutosave(profile, nextStep);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      triggerAutosave(profile, prevStep);
    }
  };

  const handleAddLink = async () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setAddingLink(true);
    const res = await addOnboardingLink({
      orderId: order.id,
      profileId: profile.id,
      kind: newKind,
      label: newLabel,
      url: newUrl,
    });
    setAddingLink(false);
    if (res.ok && res.link) {
      setLinks((prev) => [
        ...prev,
        {
          id: res.link.id,
          kind: res.link.kind as any,
          label: res.link.label,
          url: res.link.url,
          order: res.link.order,
        },
      ]);
      setNewLabel("");
      setNewUrl("");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    await deleteOnboardingLink({
      orderId: order.id,
      profileId: profile.id,
      linkId,
    });
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  const handleConfirmProfile = async () => {
    setFinishing(true);
    const res = await finalizeOnboarding({
      orderId: order.id,
      profileId: profile.id,
    });
    setFinishing(false);
    if (res.ok) {
      if (res.pendingSeats && res.pendingSeats > 0) {
        router.push(`/onboarding/${order.id}/seats`);
        return;
      }
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full mx-auto p-8 rounded-3xl border bg-card shadow-soft text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-medium text-emerald-700 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              TODO LISTO ✓
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground pt-2">
              Tu Volt Card está lista para entrar en producción.
            </h1>
            <p className="text-muted-foreground text-sm">
              Vinculamos tu perfil de forma permanente a tu tarjeta NFC y código QR.
            </p>
          </div>

          <div className="border bg-secondary/40 rounded-2xl p-4 text-left space-y-2 text-sm font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Pedido:</span>
              <span className="text-foreground font-semibold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Perfil humano:</span>
              <span className="text-violet-600 font-semibold">{appHost}/{profile.slug}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>URL física permanente:</span>
              <span className="text-muted-foreground">{appHost}/c/{profile.publicId}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Estado:</span>
              <span className="text-emerald-600">Listo para producción</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              className="flex-1 py-3 px-4 rounded-xl bg-secondary hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver perfil público
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-500/25"
            >
              Ir a mi Panel Volt
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-30 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs uppercase font-mono tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            VOLT CARDS
          </Link>
          <span className="text-border">/</span>
          <span className="text-xs font-mono text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200">
            {order.orderNumber}
          </span>
        </div>

        {/* Autosave Indicator */}
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                <span className="hidden sm:inline">Guardando cambios...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline text-emerald-600">Progreso guardado</span>
              </>
            ) : (
              <span className="hidden sm:inline">Autosave activo</span>
            )}
          </div>

          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono py-1 px-3 rounded-lg border hover:bg-secondary"
          >
            Guardar y salir
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Stepper + Formulario guiado (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-8">
            {/* Stepper Superior */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Paso {step} de 7: {STEPS[step - 1].title}
                </span>
                <span className="text-xs text-violet-600 font-medium font-mono">
                  {Math.round((step / 7) * 100)}% COMPLETADO
                </span>
              </div>

              {/* Step indicator pills */}
              <div className="grid grid-cols-7 gap-1.5">
                {STEPS.map((s) => (
                  <button
                    key={s.num}
                    onClick={() => {
                      setStep(s.num);
                      triggerAutosave(profile, s.num);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      s.num < step
                        ? "bg-emerald-400"
                        : s.num === step
                        ? "bg-violet-600 shadow-sm shadow-violet-600/30"
                        : "bg-secondary hover:bg-muted"
                    }`}
                    title={s.title}
                  />
                ))}
              </div>
            </div>

            {/* Step Body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* PASO 1: IDENTIDAD */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Tu identidad profesional
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Esta información es la primera que verán cuando lean tu Volt Card.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Nombre completo o marca *
                        </label>
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => updateProfileState({ fullName: e.target.value })}
                          placeholder="Ej. Ignacio López"
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            Cargo / Título profesional
                          </label>
                          <input
                            type="text"
                            value={profile.jobTitle || ""}
                            onChange={(e) => updateProfileState({ jobTitle: e.target.value })}
                            placeholder="Ej. CEO & Founder"
                            className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            Empresa u organización
                          </label>
                          <input
                            type="text"
                            value={profile.companyName || ""}
                            onChange={(e) => updateProfileState({ companyName: e.target.value })}
                            placeholder="Ej. Volt Inc."
                            className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Bio / Descripción breve
                        </label>
                        <textarea
                          rows={3}
                          value={profile.description || ""}
                          onChange={(e) => updateProfileState({ description: e.target.value })}
                          placeholder="Contá brevemente a qué te dedicás o qué proyectos liderás..."
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          URL de Avatar / Foto (opcional)
                        </label>
                        <input
                          type="url"
                          value={profile.avatarUrl || ""}
                          onChange={(e) => updateProfileState({ avatarUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 2: TU URL / SLUG */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Tu enlace personalizado
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Elegí el nombre de tu URL digital para compartir en bios o firmas de email.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Tu slug público
                        </label>
                        <div className="flex rounded-xl overflow-hidden border bg-background shadow-soft focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500">
                          <span className="px-4 py-3 bg-secondary text-xs font-mono text-muted-foreground border-r flex items-center">
                            {appHost}/
                          </span>
                          <input
                            type="text"
                            value={profile.slug}
                            onChange={(e) =>
                              updateProfileState({ slug: normalizeSlug(e.target.value) })
                            }
                            placeholder="tu-nombre"
                            className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 flex items-start gap-3 text-xs text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground block mb-0.5">
                            Tu tarjeta física nunca se rompe
                          </strong>
                          El chip NFC y QR físico de tu tarjeta utilizan un identificador permanente{" "}
                          <span className="font-mono text-violet-600">/c/{profile.publicId}</span>. Si en
                          el futuro cambiás tu slug, tu tarjeta seguirá funcionando automáticamente.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: CONTACTO */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Datos de contacto directo
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permití que tus contactos te llamen, escriban por WhatsApp o te envíen un correo en 1 tap.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          WhatsApp *
                        </label>
                        <input
                          type="tel"
                          value={profile.whatsapp || ""}
                          onChange={(e) => updateProfileState({ whatsapp: e.target.value })}
                          placeholder="+54 9 11 ..."
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Email de contacto
                        </label>
                        <input
                          type="email"
                          value={profile.email || ""}
                          onChange={(e) => updateProfileState({ email: e.target.value })}
                          placeholder="contacto@tuempresa.com"
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Teléfono de línea o móvil
                        </label>
                        <input
                          type="tel"
                          value={profile.phone || ""}
                          onChange={(e) => updateProfileState({ phone: e.target.value })}
                          placeholder="+54 11 ..."
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Sitio Web
                        </label>
                        <input
                          type="url"
                          value={profile.website || ""}
                          onChange={(e) => updateProfileState({ website: e.target.value })}
                          placeholder="https://..."
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Ubicación / Ciudad
                        </label>
                        <input
                          type="text"
                          value={profile.location || ""}
                          onChange={(e) => updateProfileState({ location: e.target.value })}
                          placeholder="Buenos Aires, Argentina"
                          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 4: REDES Y LINKS */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Redes sociales y enlaces
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vinculá tus perfiles profesionales y añade links personalizados a tus proyectos.
                      </p>
                    </div>

                    {/* Redes Principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Instagram (usuario o URL)
                        </label>
                        <input
                          type="text"
                          value={profile.instagram || ""}
                          onChange={(e) => updateProfileState({ instagram: e.target.value })}
                          placeholder="@usuario"
                          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          LinkedIn (usuario o URL)
                        </label>
                        <input
                          type="text"
                          value={profile.linkedin || ""}
                          onChange={(e) => updateProfileState({ linkedin: e.target.value })}
                          placeholder="in/usuario"
                          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          X / Twitter
                        </label>
                        <input
                          type="text"
                          value={profile.twitter || ""}
                          onChange={(e) => updateProfileState({ twitter: e.target.value })}
                          placeholder="@usuario"
                          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          TikTok
                        </label>
                        <input
                          type="text"
                          value={profile.tiktok || ""}
                          onChange={(e) => updateProfileState({ tiktok: e.target.value })}
                          placeholder="@usuario"
                          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Links Custom */}
                    <div className="pt-4 border-t space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">Botones adicionales</h3>

                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-3 rounded-xl border bg-secondary/50 text-sm"
                        >
                          <div>
                            <span className="font-medium text-foreground">{link.label}</span>
                            <span className="text-xs text-muted-foreground block truncate max-w-xs">
                              {link.url}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* Add new custom link form */}
                      <div className="p-4 rounded-xl border bg-card space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Etiqueta (ej. Mi Portfolio)"
                            className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                          />
                          <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="URL (https://...)"
                            className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddLink}
                          disabled={addingLink || !newLabel || !newUrl}
                          className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-xs font-medium text-foreground flex items-center gap-2 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar botón</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 5: DISEÑO */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Plantilla y estilo visual
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Elegí la plantilla que mejor se adapte a tu profesión y el color de acento.
                      </p>
                    </div>

                    {/* Plantillas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TEMPLATE_CATALOG.map((t) => {
                        const active = profile.template === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              updateProfileState({
                                template: t.id,
                                primaryColor: t.defaultColor,
                              })
                            }
                            className={`p-3 rounded-2xl border text-left transition-all relative ${
                              active
                                ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/30"
                                : "border bg-card hover:border-violet-300"
                            }`}
                          >
                            <div className="text-xs font-semibold text-foreground">{t.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {t.niche}
                            </div>
                            {active && (
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Color de acento */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-medium text-foreground/70">
                        Color de acento
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateProfileState({ primaryColor: color })}
                            className={`w-8 h-8 rounded-full border transition-transform ${
                              profile.primaryColor === color
                                ? "scale-110 ring-2 ring-violet-600 ring-offset-2 ring-offset-background"
                                : "hover:scale-105 border-border"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Modo Claro / Oscuro */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-medium text-foreground/70">
                        Modo de visualización
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => updateProfileState({ themeMode: "DARK" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-medium transition-colors ${
                            profile.themeMode === "DARK"
                              ? "bg-foreground border-foreground text-background"
                              : "bg-card border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Oscuro (Dark)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProfileState({ themeMode: "LIGHT" })}
                          className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-medium transition-colors ${
                            profile.themeMode === "LIGHT"
                              ? "bg-white text-foreground border-foreground shadow-soft"
                              : "bg-card border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Claro (Light)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 6: VISTA PREVIA */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Vista previa de tu perfil
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Así es exactamente como se verá tu perfil cuando alguien acerque tu Volt Card o escanee tu QR.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border bg-card space-y-3 text-sm">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="font-semibold text-foreground">{profile.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-muted-foreground">Enlace web:</span>
                        <span className="font-mono text-violet-600">{appHost}/{profile.slug}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-muted-foreground">Plantilla:</span>
                        <span className="text-foreground">{profile.template}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Botones configurados:</span>
                        <span className="text-foreground">{links.length} enlaces</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Podés volver a los pasos anteriores para retocar cualquier dato antes de enviarlo a producción física.
                    </p>
                  </div>
                )}

                {/* PASO 7: CONFIRMACIÓN */}
                {step === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        Confirmar y enviar a producción
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tu perfil digital está completo. Al confirmar, vincularemos tu Volt Card física y comenzaremos la fabricación.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-violet-50 border border-violet-200 space-y-4">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-8 h-8 text-violet-600" />
                        <div>
                          <h4 className="font-semibold text-foreground">Vínculo NFC y QR Definitivo</h4>
                          <p className="text-xs text-muted-foreground">
                            URL permanente asignada: <span className="font-mono text-violet-600">{appHost}/c/{profile.publicId}</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Una vez confirmada, tu tarjeta pasará al estado{" "}
                        <span className="text-emerald-600 font-semibold">Listo para producción</span>.
                        Podrás seguir actualizando el contenido de tu perfil en cualquier momento desde tu cuenta.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={finishing}
                      onClick={handleConfirmProfile}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 hover:opacity-95 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {finishing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Finalizando y enviando a producción...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>CONFIRMAR Y ENVIAR A PRODUCCIÓN</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Botones de Navegación Inferior */}
          {step < 7 && (
            <div className="flex items-center justify-between pt-8 border-t mt-8">
              <button
                type="button"
                disabled={step === 1}
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border hover:bg-secondary text-muted-foreground hover:text-foreground text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-violet-500/25"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Vista Previa Móvil Interactiva (5 cols) */}
        <div className="lg:col-span-5 flex justify-center items-start">
          <div className="sticky top-24 w-full max-w-[340px]">
            <div className="text-center mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">
                VISTA PREVIA EN VIVO
              </span>
            </div>
            <PhonePreview profile={profile} links={links} />
          </div>
        </div>
      </div>
    </main>
  );
}
