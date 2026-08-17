import logger from "../../../shared/logger/logger";
import { IAIProvider } from "./provider.interface";
import { GroqProvider } from "./groq.provider";
import { CerebrasProvider } from "./cerebras.provider";
import env from "../../../config/env";

type TierProviderName = "groq" | "cerebras";

export class ProviderFactory {
  private static instance: ProviderFactory | null = null;

  private readonly tier1: IAIProvider;
  private readonly tier2: IAIProvider;
  private readonly tier3: IAIProvider;

  private constructor() {
    this.tier1 = ProviderFactory.buildProvider(
      env.AI_TIER1_PROVIDER as TierProviderName,
      "forTier1",
    );
    this.tier2 = ProviderFactory.buildProvider(
      env.AI_TIER2_PROVIDER as TierProviderName,
      "forTier2",
    );
    this.tier3 = ProviderFactory.buildProvider(
      env.AI_TIER3_PROVIDER as TierProviderName,
      "forTier3",
    );

    logger.info(
      {
        service: "ProviderFactory",
        tier1: env.AI_TIER1_PROVIDER,
        tier2: env.AI_TIER2_PROVIDER,
        tier3: env.AI_TIER3_PROVIDER,
      },
      "AI providers initialized",
    );
  }

  private static buildProvider(
    providerName: TierProviderName,
    factoryMethod: "forTier1" | "forTier2" | "forTier3",
  ): IAIProvider {
    switch (providerName) {
      case "groq":
        return GroqProvider[factoryMethod]();
      case "cerebras":
        return CerebrasProvider[factoryMethod]();
      default:
        throw new Error(`Unknown AI provider: ${providerName}`);
    }
  }

  static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  getTier1Provider(): IAIProvider {
    return this.tier1;
  }

  getTier2Provider(): IAIProvider {
    return this.tier2;
  }

  getTier3Provider(): IAIProvider {
    return this.tier3;
  }
}