'use server';
/**
 * @fileOverview A robust Genkit flow for generating personalized food recommendations.
 * Optimized for consistency and deterministic output based on provided entropy.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SimpleFoodItemSchema = z.object({
  id: z.string().describe('Unique identifier for the food item.'),
  name: z.string().describe('Name of the food item.'),
  category: z.string().describe('Category of the food item.'),
});

const UserFoodHistoryItemSchema = z.object({
  name: z.string().describe('Name of a food item previously ordered.'),
  category: z.string().optional().describe('Category of the item.'),
});

const FullFoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  rating: z.number().optional(),
  image: z.string().optional(),
  imageURL: z.string().optional(),
  isVeg: z.boolean().optional(),
  description: z.string().optional(),
  reason: z.string().optional().describe('A brief explanation of why this dish was recommended.'),
});

const PersonalizedFoodRecommendationsInputSchema = z.object({
  userFoodHistory: z.array(UserFoodHistoryItemSchema),
  availableFoods: z.array(FullFoodItemSchema),
  recentlySeenIds: z.array(z.string()).optional(),
  entropy: z.number().optional().describe('A random value to influence variety.'),
});
export type PersonalizedFoodRecommendationsInput = z.infer<typeof PersonalizedFoodRecommendationsInputSchema>;

const PersonalizedFoodRecommendationsOutputSchema = z.object({
  recommendations: z.array(FullFoodItemSchema),
});
export type PersonalizedFoodRecommendationsOutput = z.infer<typeof PersonalizedFoodRecommendationsOutputSchema>;

export async function personalizedFoodRecommendations(
  input: PersonalizedFoodRecommendationsInput
): Promise<PersonalizedFoodRecommendationsOutput> {
  return personalizedFoodRecommendationsFlow(input);
}

const recommendationPrompt = ai.definePrompt({
  name: 'personalizedFoodRecommendationPrompt',
  input: {
    schema: z.object({
      userFoodHistory: z.array(UserFoodHistoryItemSchema),
      simplifiedAvailableFoods: z.array(SimpleFoodItemSchema),
      recentlySeenIds: z.array(z.string()).optional(),
      entropy: z.number().optional(),
    }),
  },
  output: {
    schema: z.object({
      recommendations: z.array(z.object({
        id: z.string(),
        reason: z.string().describe('Max 60 chars explanatory reason.')
      })).max(5),
    }),
  },
  prompt: `You are an expert food recommender for Bhartiya Swad.
  
  TASK:
  Analyze the user's history and select 5 dishes from the 'simplifiedAvailableFoods' list.
  
  VARIETY RULES (Entropy: {{entropy}}):
  1. DO NOT recommend items in the 'recentlySeenIds' list: {{{json recentlySeenIds}}}.
  2. If 'userFoodHistory' is EMPTY, select a diverse mix of 5 high-performing items (1 Pizza, 1 North Indian, 1 South Indian, 1 Burger, 1 Dessert).
  3. If history exists, suggest items that match their taste but prioritize items they HAVEN'T ordered yet.
  
  OUTPUT REQUIREMENTS:
  1. Provide a brief 'reason' for each (e.g. "Matches your love for spicy food", "A highly-rated favorite at Bhartiya Swad", "Classic North Indian delight").
  2. ONLY return IDs from the provided list.
  3. Return ONLY the JSON object.

  User's past food history:
  {{{json userFoodHistory}}}

  Available foods:
  {{{json simplifiedAvailableFoods}}}`,
});

const personalizedFoodRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedFoodRecommendationsFlow',
    inputSchema: PersonalizedFoodRecommendationsInputSchema,
    outputSchema: PersonalizedFoodRecommendationsOutputSchema,
  },
  async (input) => {
    const simplified = input.availableFoods.map(food => ({
      id: food.id,
      name: food.name,
      category: food.category,
    }));

    try {
      const { output } = await recommendationPrompt({
        userFoodHistory: input.userFoodHistory,
        simplifiedAvailableFoods: simplified,
        recentlySeenIds: input.recentlySeenIds || [],
        entropy: input.entropy || Math.random(),
      });

      if (!output?.recommendations) return { recommendations: [] };

      // Map back to FULL objects while preserving all Firestore fields and attaching the AI reason
      const recommendations = output.recommendations
        .map(rec => {
          const cleanId = rec.id.replace(/["']/g, '').trim();
          const baseFood = input.availableFoods.find(food => food.id === cleanId);
          if (!baseFood) return null;
          return { ...baseFood, reason: rec.reason };
        })
        .filter((f): f is z.infer<typeof FullFoodItemSchema> => !!f);

      return { recommendations };
    } catch (error) {
      console.error("AI Flow Error:", error);
      // Fallback: Use rating-based fallback if AI fails
      const fallback = input.availableFoods
        .filter(f => (f.rating || 0) >= 4.5)
        .slice(0, 5)
        .map(f => ({ ...f, reason: "A community favorite!" }));
      return { recommendations: fallback };
    }
  }
);