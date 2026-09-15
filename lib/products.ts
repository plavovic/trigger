export type Product = {
  id: string;
  number: string;
  name: string;
  description: string;
  price: string;
  image: string;
  accent?: "red" | "purple";
};

export const products: Product[] = [
  {
    id: "product01",
    number: "01",
    name: "WORKHORSE",
    description: "Everyday boilies for a dependable response.",
    price: "20 KM",
    image: "/product01.png",
  },
  {
    id: "product02",
    number: "02",
    name: "THE ONE",
    description: "Savoury frankfurter sausage boilies.",
    price: "20 KM",
    image: "/product02.png",
    accent: "red",
  },
  {
    id: "product03",
    number: "03",
    name: "PURPLE KRAKEN",
    description: "Squid and plum with an advanced flavour profile.",
    price: "20 KM",
    image: "/product03.png",
    accent: "purple",
  },
  {
    id: "product4",
    number: "04",
    name: "TRIGGER SIGNATURE",
    description: "A balanced bait for confident sessions.",
    price: "20 KM",
    image: "/product4.png",
  },
  {
    id: "product5",
    number: "05",
    name: "NIGHT RESPONSE",
    description: "A deep profile designed to keep working.",
    price: "20 KM",
    image: "/product5.png",
    accent: "purple",
  },
  {
    id: "product6",
    number: "06",
    name: "SIGNAL BAITS",
    description: "A bright, focused finish for active water.",
    price: "20 KM",
    image: "/product6.png",
    accent: "red",
  },
];