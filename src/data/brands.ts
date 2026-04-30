import type { Brand } from "@/types/catalog";

export const brands: Brand[] = [
  {
    id: "kemper",
    slug: "kemper",
    name: "KEMPER",
    tagline: "Captation et filtration de l'air industriel",
    description:
      "Référence mondiale de la captation des fumées de soudage et du dépoussiérage industriel : bras d'aspiration, extracteurs mobiles et fixes, tables aspirantes, ventilation et systèmes centralisés.",
    expertise: ["Captation à la source", "Filtration", "Tables aspirantes", "Centrale d'aspiration"],
  },
  {
    id: "dupuy",
    slug: "dupuy",
    name: "Dupuy",
    tagline: "Aspirateurs industriels mono / triphasés",
    description:
      "Gamme complète d'aspirateurs industriels eau & poussière, huiles & copeaux, dépoussiérage, ATEX, aspiration centralisée et silos.",
    expertise: ["ATEX", "Huiles & copeaux", "Centralisé", "Silos"],
  },
  {
    id: "spectron",
    slug: "spectron",
    name: "Spectron",
    tagline: "Équipement gaz industriel et laboratoire",
    description:
      "Solutions de distribution et de régulation de gaz, gaz toxiques et dangereux, systèmes d'alarme pour applications industrielles et laboratoires.",
    expertise: ["Distribution gaz", "Régulation", "Alarme gaz", "Labo & industrie"],
  },
  {
    id: "vici-dbs",
    slug: "vici-dbs",
    name: "VICI DBS",
    tagline: "Générateurs de gaz sur site",
    description:
      "Générateurs d'azote, d'hydrogène et de zero air pour laboratoires, GC, FID et applications industrielles. Autonomie et pureté constantes.",
    expertise: ["Azote N2", "Hydrogène H2", "Zero Air", "GC / FID"],
  },
  {
    id: "lincoln",
    slug: "lincoln-electric",
    name: "Lincoln Electric",
    tagline: "Soudage, coupage plasma, multi-procédés",
    description:
      "Postes MIG / TIG / MMA, sources multi-procédés, torches, consommables et systèmes de coupage plasma de référence mondiale.",
    expertise: ["MIG / MAG", "TIG", "MMA", "Plasma"],
  },
  {
    id: "kemppi",
    slug: "kemppi",
    name: "Kemppi",
    tagline: "Soudage haute performance",
    description:
      "Postes MIG / TIG / MMA premium, gougeage, torches refroidies, masques et solutions de protection respiratoire pour soudeurs.",
    expertise: ["MIG / TIG / MMA", "Gougeage", "Protection opérateur"],
  },
  {
    id: "siegmund",
    slug: "siegmund",
    name: "Siegmund",
    tagline: "Tables et systèmes de bridage",
    description:
      "Tables modulaires de soudage et de bridage, accessoires, kits, étaux et tables élévatrices pour ateliers de chaudronnerie et de production.",
    expertise: ["Tables modulaires", "Bridage", "Précision d'assemblage"],
  },
  {
    id: "axxair",
    slug: "axxair",
    name: "AXXAIR",
    tagline: "Tube : coupe, chanfrein, soudage orbital",
    description:
      "Solutions complètes de préfabrication tube : machines de coupe et chanfrein, têtes de soudage orbital TIG, qualité tuyauterie process et hygiénique.",
    expertise: ["Coupe / chanfrein", "Soudage orbital TIG", "Tuyauterie process"],
  },
  {
    id: "ficep",
    slug: "ficep",
    name: "FICEP",
    tagline: "Lignes CNC acier & forgeage",
    description:
      "Lignes de production CNC dédiées à la fabrication acier (profilés, tubes, tôles, cornières) et au forgeage. Industrie lourde, productivité élevée.",
    expertise: ["Profilés acier", "Tôles", "Forgeage", "Lignes intégrées"],
  },
  {
    id: "einhell",
    slug: "einhell",
    name: "Einhell",
    tagline: "Outillage maintenance, atelier et chantier",
    description:
      "Outillage électroportatif, compresseurs, groupes électrogènes, aspirateurs, batteries 18V et matériel d'atelier pour maintenance et chantier.",
    expertise: ["Outillage 18V", "Compresseurs", "Groupes électrogènes", "Atelier"],
  },
  {
    id: "armoires-securite",
    slug: "armoires-securite",
    name: "Armoires de sécurité",
    tagline: "Stockage & ventilation produits dangereux",
    description:
      "Armoires de sécurité, stations de stockage et de remplissage, postes de travail ventilés, systèmes de collecte et purificateurs d'air.",
    expertise: ["Stockage chimique", "Ventilation poste", "Manutention sécurisée"],
  },
];

export const brandById = Object.fromEntries(brands.map((b) => [b.id, b]));
