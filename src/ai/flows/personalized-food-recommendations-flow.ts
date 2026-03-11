'use server';
/**
 * @fileOverview A Genkit flow for generating personalized food recommendations based on user history and available food items.
 *
 * - personalizedFoodRecommendations - A function that provides food recommendations.
 * - PersonalizedFoodRecommendationsInput - The input type for the recommendations function.
 * - PersonalizedFoodRecommendationsOutput - The return type for the recommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a simplified food item that the LLM can easily consume.
// This is not the full food item schema from the database, but rather a representation
// for the LLM to understand what foods are available.
const SimpleFoodItemSchema = z.object({
  id: z.string().describe('Unique identifier for the food item.'),
  name: z.string().describe('Name of the food item.'),
  category: z.string().describe('Category of the food item (e.g., "North Indian", "Sweets").'),
});

// Define the schema for a user's past food preference/history.
const UserFoodHistoryItemSchema = z.object({
  name: z.string().describe('Name of a food item the user has previously ordered or shown preference for.'),
  category: z.string().optional().describe('Category of the food item.'),
});

// Define the full food item schema as it would appear in the database and be returned to the client.
const FullFoodItemSchema = z.object({
  id: z.string().describe('Unique identifier for the food item.'),
  name: z.string().describe('Name of the food item.'),
  price: z.number().describe('Price of the food item.'),
  category: z.string().describe('Category of the food item.'),
  rating: z.number().optional().describe('Rating of the food item.'),
  imageURL: z.string().url().optional().describe('URL to the image of the food item.'),
});


// Input schema for the flow
const PersonalizedFoodRecommendationsInputSchema = z.object({
  userFoodHistory: z.array(UserFoodHistoryItemSchema).describe('A list of food items the user has previously ordered or shown preference for.'),
  availableFoods: z.array(FullFoodItemSchema).describe('A list of all food items currently available in the system.'),
});
export type PersonalizedFoodRecommendationsInput = z.infer<typeof PersonalizedFoodRecommendationsInputSchema>;

// Output schema for the flow
const PersonalizedFoodRecommendationsOutputSchema = z.object({
  recommendations: z.array(FullFoodItemSchema).describe('A list of recommended food items tailored to the user.'),
});
export type PersonalizedFoodRecommendationsOutput = z.infer<typeof PersonalizedFoodRecommendationsOutputSchema>;

export async function personalizedFoodRecommendations(
  input: PersonalizedFoodRecommendationsInput
): Promise<PersonalizedFoodRecommendationsOutput> {
  return personalizedFoodRecommendationsFlow(input);
}

// Prompt for the LLM to generate recommendations
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
      recommendedFoodIds: z.array(z.string()).max(5).describe('An array of IDs of recommended food items from the available foods list. Limit to a maximum of 5 recommendations.'),
    }),
  },
  prompt: `You are an expert food recommender for an Indian food ordering platform.
Based on the user's past food preferences and a list of available food items, suggest 3 to 5 new food items that the user might enjoy.

Analyze the user's 'userFoodHistory' to understand their tastes (e.g., preferred categories, types of dishes).
Then, from the 'simplifiedAvailableFoods' list, select food items that are similar to their preferences but also introduce some variety or popular items they haven't tried.
Ensure all recommended items' IDs are present in the 'simplifiedAvailableFoods' list.
Avoid recommending items that are explicitly listed in the 'userFoodHistory'.

User's past food history:
{{{json userFoodHistory}}}

Simplified list of all available foods (ID, Name, Category):
{{{json simplifiedAvailableFoods}}}

Please provide only the IDs of the recommended food items.`,
});

// Genkit Flow definition
const personalizedFoodRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedFoodRecommendationsFlow',
    inputSchema: PersonalizedFoodRecommendationsInputSchema,
    outputSchema: PersonalizedFoodRecommendationsOutputSchema,
  },
  async (input) => {
    // Simplify available foods for the prompt to reduce token count and focus the LLM on IDs.
    const simplifiedAvailableFoods = input.availableFoods.map(food => ({
      id: food.id,
      name: food.name,
      category: food.category,
    }));

    const { output } = await recommendationPrompt({
      userFoodHistory: input.userFoodHistory,
      simplifiedAvailableFoods: simplifiedAvailableFoods,
    });

    if (!output || !output.recommendedFoodIds) {
      return { recommendations: [] };
    }

    // Filter available foods to get the full objects for the recommended IDs
    const recommendations = output.recommendedFoodIds
      .map(id => input.availableFoods.find(food => food.id === id))
      .filter((food): food is z.infer<typeof FullFoodItemSchema> => food !== undefined);

    return { recommendations };
  }
);
