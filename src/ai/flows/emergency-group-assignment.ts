'use server';

/**
 * @fileOverview This file defines a Genkit flow for assigning users to emergency response groups based on their address.
 *
 * It includes:
 * - `assignEmergencyGroup`: A function to initiate the flow and return the assigned group's information.
 * - `EmergencyGroupInput`: The input type for the `assignEmergencyGroup` function, including the user's address.
 * - `EmergencyGroupOutput`: The output type, providing the name and contact information of the assigned emergency group.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmergencyGroupInputSchema = z.object({
  address: z
    .string()
    .describe('The user\'s address to determine the colonia group.'),
});
export type EmergencyGroupInput = z.infer<typeof EmergencyGroupInputSchema>;

const EmergencyGroupOutputSchema = z.object({
  groupName: z.string().describe('The name of the assigned colonia group.'),
  contactInformation: z
    .string()
    .describe('Contact information for the colonia group.'),
});
export type EmergencyGroupOutput = z.infer<typeof EmergencyGroupOutputSchema>;

export async function assignEmergencyGroup(
  input: EmergencyGroupInput
): Promise<EmergencyGroupOutput> {
  return assignEmergencyGroupFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emergencyGroupPrompt',
  input: {schema: EmergencyGroupInputSchema},
  output: {schema: EmergencyGroupOutputSchema},
  prompt: `Based on the following address: {{{address}}}, determine the correct colonia emergency response group and provide the group name and contact information. If the address cannot be matched to a group, respond that you cannot determine the group, and leave the contact information blank.`,
});

const assignEmergencyGroupFlow = ai.defineFlow(
  {
    name: 'assignEmergencyGroupFlow',
    inputSchema: EmergencyGroupInputSchema,
    outputSchema: EmergencyGroupOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
