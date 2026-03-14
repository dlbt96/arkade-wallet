import type { Wallet } from "@arkade-os/sdk";
import { AutoOnboarder } from "./onboarder";
import { VtxoRenewer } from "./renewer";

interface SchedulerConfig {
  onboardIntervalMs: number;
  renewalIntervalMs: number;
  renewalThresholdSecs: number;
}

export class Scheduler {
  private readonly onboarder: AutoOnboarder;
  private readonly renewer: VtxoRenewer;
  private readonly config: SchedulerConfig;
  private intervals: Array<ReturnType<typeof setInterval>> = [];

  constructor(wallet: Wallet, config: SchedulerConfig) {
    this.onboarder = new AutoOnboarder(wallet);
    this.renewer = new VtxoRenewer(wallet, config.renewalThresholdSecs);
    this.config = config;
  }

  start(): void {
    if (this.intervals.length > 0) return;

    const onboardInterval = setInterval(() => {
      this.onboarder.tick().catch((err: Error) => {
        console.error("[Scheduler] Onboard tick error:", err.message);
      });
    }, this.config.onboardIntervalMs);

    const renewalInterval = setInterval(() => {
      this.renewer.tick().catch((err: Error) => {
        console.error("[Scheduler] Renewal tick error:", err.message);
      });
    }, this.config.renewalIntervalMs);

    this.intervals = [onboardInterval, renewalInterval];
    this.onboarder.tick().catch(() => {});
  }

  stop(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }

    this.intervals = [];
  }
}
