import { Colors, type ThemeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useColors(): ThemeColors {
  const scheme = useColorScheme() ?? "light";
  return Colors[scheme];
}
