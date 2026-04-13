'use server';
/**
 * @fileOverview A robust Genkit flow for generating personalized food recommendations.
 * Handles cold-starts (new users) and ensures strict ID matching.
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
});

const PersonalizedFoodRecommendationsInputSchema = z.object({
  userFoodHistory: z.array(UserFoodHistoryItemSchema),
  availableFoods: z.array(FullFoodItemSchema),
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
    }),
  },
  output: {
    schema: z.object({
      recommendedFoodIds: z.array(z.string()).max(5),
    }),
  },
  prompt: `You are an expert food recommender for Bhartiya Swad.
  
  TASK:
  Analyze the user's history and select 3-5 dishes from the 'simplifiedAvailableFoods' list.
  
  COLD START HANDLING:
  If 'userFoodHistory' is EMPTY, recommend a diverse mix of popular items (e.g., 1 Burger, 1 Pizza, 1 North Indian).
  
  PERSONALIZATION:
  If history exists, suggest items similar in category or flavor profile to what they liked.
  
  STRICT RULES:
  1. ONLY return IDs from the provided list.
  2. Do not recommend items the user has already ordered if possible.
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
      });

      if (!output?.recommendedFoodIds) return { recommendations: [] };

      // Sanitize IDs from AI (remove potential quotes/spaces) and find full objects
      const recommendations = output.recommendedFoodIds
        .map(id => {
          const cleanId = id.replace(/["']/g, '').trim();
          return input.availableFoods.find(food => food.id === cleanId);
        })
        .filter((f): f is z.infer<typeof FullFoodItemSchema> => !!f);

      // Fallback: If AI fails to find valid IDs, return top 3 rated items
      if (recommendations.length === 0) {
        return { 
          recommendations: [...input.availableFoods]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3) 
        };
      }

      return { recommendations };
    } catch (error) {
      console.error("AI Flow Error:", error);
      return { recommendations: input.availableFoods.slice(0, 3) };
    }
  }
);