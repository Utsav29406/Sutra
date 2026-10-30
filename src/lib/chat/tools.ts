import { products, getProductBySlug } from "@/lib/products";
import type { Product } from "@/lib/products";
import type { ChatContext } from "@/lib/chat/catalogue";

export interface ProductSummary {
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  fabric: string;
  craftName: string | null;
  state: string | null;
  stock: number;
}

export function summarize(p: Product): ProductSummary {
  return {
    slug: p.slug,
    name: p.name,
    image: p.images[0],
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    fabric: p.fabric,
    craftName: p.craftName,
    state: p.state,
    stock: p.stock,
  };
}

export const toolDefinitions = [
  {
    name: "search_products",
    description:
      "Search the Sutra catalogue. Use this whenever someone asks what to wear, what you have, or for anything in a price range. Returns matching pieces with price, fabric, craft and stock.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free text matched against name, fabric, craft, origin state and description. e.g. 'silk saree', 'leheriya', 'sherwani'.",
        },
        category: {
          type: "string",
          enum: ["women", "men"],
          description: "Restrict to one category.",
        },
        maxPrice: { type: "number", description: "Maximum price in rupees." },
        minPrice: { type: "number", description: "Minimum price in rupees." },
      },
    },
  },
  {
    name: "get_product",
    description:
      "Full detail on one piece, including every available size and the exact stock count. Use before recommending a specific size or adding to cart.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The product slug, e.g. 'leheriya-georgette-saree'." },
      },
      required: ["slug"],
    },
  },
  {
    name: "lookup_orders",
    description:
      "Look up this person's orders — status, items, total and when it was placed. Use for any 'where is my order' question.",
    input_schema: {
      type: "object" as const,
      properties: {
        orderId: {
          type: "string",
          description: "A specific order id. Omit to list all of their orders.",
        },
      },
    },
  },
  {
    name: "add_to_cart",
    description:
      "Add a piece to their cart. Only call this when they have clearly asked for it, and only with a size the product actually offers.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The product slug." },
        size: { type: "string", description: "One of the product's available sizes." },
        quantity: { type: "number", description: "Defaults to 1." },
      },
      required: ["slug", "size"],
    },
  },
];

type ToolInput = Record<string, unknown>;

export interface ToolOutcome {
  /** Text handed back to the model as the tool result. */
  result: string;
  /** Product cards for the widget to render. */
  products?: ProductSummary[];
  /** A cart mutation the browser must apply, since the cart lives in client state. */
  action?: {
    name: "add_to_cart";
    item: {
      productId: string;
      slug: string;
      name: string;
      image: string;
      price: number;
      size: string;
      quantity: number;
      stock: number;
    };
  };
}

function str(input: ToolInput, key: string): string | undefined {
  const v = input[key];
  return typeof v === "string" ? v : undefined;
}

function num(input: ToolInput, key: string): number | undefined {
  const v = input[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function runTool(
  name: string,
  input: ToolInput,
  context: ChatContext
): ToolOutcome {
  switch (name) {
    case "search_products": {
      const query = str(input, "query")?.toLowerCase().trim();
      const category = str(input, "category");
      const maxPrice = num(input, "maxPrice");
      const minPrice = num(input, "minPrice");

      const terms = query ? query.split(/\s+/).filter(Boolean) : [];
      let found = products.filter((p) => {
        if (category && p.category.slug !== category) return false;
        if (maxPrice !== undefined && p.price > maxPrice) return false;
        if (minPrice !== undefined && p.price < minPrice) return false;
        if (!terms.length) return true;
        const hay = [
          p.name,
          p.fabric,
          p.craftName ?? "",
          p.state ?? "",
          p.description,
          p.category.name,
        ]
          .join(" ")
          .toLowerCase();
        return terms.some((t) => hay.includes(t));
      });

      found = found.slice(0, 6);
      if (!found.length) {
        return { result: "No pieces in the catalogue match that." };
      }
      const lines = found
        .map(
          (p) =>
            `${p.name} [${p.slug}] — ₹${p.price}${
              p.compareAtPrice ? ` (was ₹${p.compareAtPrice})` : ""
            } · ${p.fabric}${p.craftName ? ` · ${p.craftName}` : ""}${
              p.state ? ` · ${p.state}` : ""
            } · ${p.stock > 0 ? `${p.stock} in stock` : "OUT OF STOCK"}`
        )
        .join("\n");
      return { result: lines, products: found.map(summarize) };
    }

    case "get_product": {
      const slug = str(input, "slug");
      const p = slug ? getProductBySlug(slug) : undefined;
      if (!p) return { result: `No product with slug "${slug}".` };
      return {
        result: [
          `${p.name} [${p.slug}]`,
          `Price: ₹${p.price}${p.compareAtPrice ? ` (was ₹${p.compareAtPrice})` : ""}`,
          `Fabric: ${p.fabric}`,
          p.craftName ? `Craft: ${p.craftName}` : null,
          p.state ? `Origin: ${p.state}` : null,
          `Sizes: ${p.sizes.join(", ")}`,
          `Stock: ${p.stock}`,
          `Rating: ${p.rating}`,
          `About: ${p.description}`,
        ]
          .filter(Boolean)
          .join("\n"),
        products: [summarize(p)],
      };
    }

    case "lookup_orders": {
      if (!context.user) {
        return { result: "Not signed in, so no orders are visible. Ask them to sign in." };
      }
      const orders = context.orders ?? [];
      const orderId = str(input, "orderId");
      const matches = orderId
        ? orders.filter((o) => o.id.toLowerCase() === orderId.toLowerCase())
        : orders;
      if (!matches.length) {
        return {
          result: orderId
            ? `No order found with id ${orderId}.`
            : "This account has no orders yet.",
        };
      }
      const lines = matches
        .slice(0, 5)
        .map((o) => {
          const items = o.items
            .map((i) => `${i.name} (size ${i.size}) x${i.quantity}`)
            .join(", ");
          return `Order ${o.id} — status ${o.status}, placed ${new Date(
            o.placedAt
          ).toDateString()}, total ₹${o.total}, paid by ${
            o.paymentMethod === "cod" ? "cash on delivery" : "card"
          }. Items: ${items}. Delivering to: ${o.address}`;
        })
        .join("\n");
      return { result: lines };
    }

    case "add_to_cart": {
      const slug = str(input, "slug");
      const size = str(input, "size");
      const quantity = Math.max(1, Math.floor(num(input, "quantity") ?? 1));
      const p = slug ? getProductBySlug(slug) : undefined;
      if (!p) return { result: `No product with slug "${slug}". Nothing was added.` };
      if (p.stock <= 0) {
        return { result: `${p.name} is out of stock. Nothing was added.` };
      }
      if (!size || !p.sizes.includes(size)) {
        return {
          result: `"${size}" is not a size ${p.name} comes in. Available: ${p.sizes.join(
            ", "
          )}. Nothing was added.`,
        };
      }
      return {
        result: `Added ${quantity} x ${p.name} (size ${size}) to their cart.`,
        products: [summarize(p)],
        action: {
          name: "add_to_cart",
          item: {
            productId: p.id,
            slug: p.slug,
            name: p.name,
            image: p.images[0],
            price: p.price,
            size,
            quantity,
            stock: p.stock,
          },
        },
      };
    }

    default:
      return { result: `Unknown tool "${name}".` };
  }
}
