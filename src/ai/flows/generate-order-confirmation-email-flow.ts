
'use server';
/**
 * @fileOverview A Genkit flow to generate order confirmation email content.
 *
 * - generateOrderConfirmationEmail - A function that handles the email content generation.
 * - OrderConfirmationEmailInput - The input type for the flow.
 * - OrderConfirmationEmailOutput - The return type for the flow (subject and HTML body).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { OrderConfirmationEmailInput as FlowInput, OrderConfirmationEmailOutput as FlowOutput } from '@/types';

// Define Zod schemas based on the types from src/types/index.ts
const OrderConfirmationEmailInputSchema = z.object({
  customerName: z.string().describe('The full name of the customer.'),
  customerEmail: z.string().email().describe('The email address of the customer.'),
  orderId: z.string().describe('The unique identifier for the order.'),
  items: z.array(z.object({
    name: z.string().describe('Name of the product.'),
    quantity: z.number().int().positive().describe('Quantity of the product ordered.'),
    price: z.number().positive().describe('Price per unit of the product.'),
    imageUrl: z.string().url().describe('URL of the product image.'),
    imageHint: z.string().optional().describe('Hint for AI if image is placeholder.'),
  })).min(1).describe('An array of items included in the order.'),
  totalAmount: z.number().positive().describe('The total amount of the order.'),
  shippingAddress: z.object({
    fullName: z.string().describe('Full name for shipping.'),
    addressLine1: z.string().describe('Primary line of the shipping address.'),
    addressLine2: z.string().optional().describe('Secondary line of the shipping address (e.g., apartment number).'),
    city: z.string().describe('City for shipping.'),
    postalCode: z.string().describe('Postal code for shipping.'),
    country: z.string().describe('Country for shipping.'),
  }).describe('The customer\'s shipping address details.'),
  shopName: z.string().describe('The name of the e-commerce shop.'),
  shopUrl: z.string().url().describe('The base URL of the e-commerce shop.'),
});

const OrderConfirmationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line for the order confirmation email.'),
  htmlBody: z.string().describe('The HTML content for the body of the order confirmation email. This should be a complete HTML document snippet, well-formatted for email clients, including styles within <style> tags or inline styles. Make it visually appealing. Include product images if available.'),
});

export async function generateOrderConfirmationEmail(input: FlowInput): Promise<FlowOutput> {
  return orderConfirmationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'orderConfirmationEmailPrompt',
  input: { schema: OrderConfirmationEmailInputSchema },
  output: { schema: OrderConfirmationEmailOutputSchema },
  prompt: `
    You are an expert e-commerce assistant for a shop named "{{shopName}}".
    Your task is to generate a friendly, professional, and visually appealing HTML order confirmation email.

    Order Details:
    - Order ID: {{orderId}}
    - Customer Name: {{customerName}}
    - Customer Email: {{customerEmail}}
    - Total Amount: ${{totalAmount}}

    Shipping Address:
    - Name: {{shippingAddress.fullName}}
    - Address: {{shippingAddress.addressLine1}}{{#if shippingAddress.addressLine2}}, {{shippingAddress.addressLine2}}{{/if}}
    - City, Postal Code: {{shippingAddress.city}}, {{shippingAddress.postalCode}}
    - Country: {{shippingAddress.country}}

    Items Ordered:
    {{#each items}}
    - {{quantity}} x {{name}} @ ${{price}} each
    {{/each}}

    Instructions for the Email Content:
    1.  **Subject Line**: Create a clear and concise subject line, like "Your {{shopName}} Order #{{orderId}} is Confirmed!" or "Order Confirmation: {{shopName}} #{{orderId}}".
    2.  **HTML Body**:
        *   Start with a friendly greeting to the customer (e.g., "Hi {{customerName}},").
        *   Thank them for their order from {{shopName}}.
        *   Clearly state that their order #{{orderId}} is confirmed.
        *   Provide a summary of the order, including:
            *   Order ID.
            *   Items purchased (name, quantity, price per item, total price for item line).
            *   You can display item images using a table or divs for layout. Use {{items.imageUrl}} for the image source. Ensure images are reasonably sized (e.g., width="80").
            *   Subtotal, Shipping (if applicable, assume free for now unless specified otherwise), and Total Amount.
        *   Display the shipping address clearly.
        *   Mention that they will receive another email when their order ships (if applicable).
        *   Include a closing, like "Thanks for shopping with us!" or "We appreciate your business!".
        *   Include the shop name ({{shopName}}) and a link to the shop ({{shopUrl}}).
    3.  **Styling**:
        *   The HTML body should be well-formatted and suitable for email clients.
        *   Use inline CSS or "style" HTML tags within the HTML body for styling. Avoid external stylesheets.
        *   Make it visually appealing. Consider using a simple table structure for order items if it helps with layout in emails.
        *   Ensure good contrast and readability. Primary color for the shop could be #E63946 if you need a brand color.
    4.  **Do not include any placeholder images like 'placehold.co' in the final email.** If an item's imageUrl points to a placeholder, describe the item without an image or use a generic product icon if you can generate/find a suitable one (but prefer no image over a bad placeholder in an email). For this task, if an item has an image, try to include it.
    5.  Be polite and professional.

    Generate the subject and htmlBody fields according to the OrderConfirmationEmailOutputSchema.
  `,
  config: {
    safetySettings: [ 
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  }
});

const orderConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'orderConfirmationEmailFlow',
    inputSchema: OrderConfirmationEmailInputSchema,
    outputSchema: OrderConfirmationEmailOutputSchema,
  },
  async (input) => {
    // Minor data transformation: ensure prices are formatted if needed by prompt
    const processedInput = {
        ...input,
        items: input.items.map(item => ({
            ...item,
            price: parseFloat(item.price.toFixed(2)) // ensure 2 decimal places
        })),
        totalAmount: parseFloat(input.totalAmount.toFixed(2))
    };

    const { output } = await prompt(processedInput);
    if (!output) {
      throw new Error("Failed to generate email content from prompt.");
    }
    return output;
  }
);

export type { FlowInput as OrderConfirmationEmailInput, FlowOutput as OrderConfirmationEmailOutput };
