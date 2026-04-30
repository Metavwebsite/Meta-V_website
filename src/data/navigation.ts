export const navigation = [
  { label: "Accueil", to: "/" },
  { label: "Matériel", to: "/materiel" },
  { label: "Prestations & Services", to: "/prestations-services" },
  { label: "Marques", to: "/marques" },
  { label: "À propos", to: "/a-propos" },
  { label: "Contact", to: "/contact" },
] as const;

export const company = {
  name: "Meta-V Solutions",
  tagline: "Équipements industriels & solutions techniques",
  description:
    "Meta-V Solutions accompagne les industriels avec des équipements techniques et des solutions adaptées aux problématiques terrain.",
  email: "contact@meta-v.ma",
  phone: "+212 5 22 00 00 00",
  address: "Casablanca, Maroc",
  social: {
    linkedin: "#",
  },
};
