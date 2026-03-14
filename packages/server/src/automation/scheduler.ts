import { AutoOnboarder } from "./onboarder.js";
import { VTXORenewer } from "./renewer.js";
import type { Wallet } from "@arkade-os/sdk";

interface SchedulerConfig {
  onboardIntervalMs: number;
  renewalIntervalMs: number;
  renewalThresholdSecs: number;
}

/**
 * Scheduler manages background automation tasks:
 * - Auto-onboard: converts boarding deposits to VTXOs
 * - VTXO renewal: refreshes VTXOs before they expire
 */
export class Scheduler {
  private onboarder: AutoOnboarder;
  private renewer: VTXORenewer;
  private config: SchedulerConfig;
  private intervals: NodeJS.Timeout[] = [];

  constructor(wallet: Wallet, config: SchedulerConfig) {
    this.onboarder = new AutoOnboarder(wallet);
    this.renewer = new VTXORenewer(wallet, config.renewalThresholdSecs);
    this.config = config;
  }

  start(): void {
    console.log("[Scheduler] Starting background automation...");

    // Auto-onboard check
    const onboardInterval = setInterval(async () => {
      try {
        await this.onboarder.tick();
      } catch (err: any) {
        console.error("[Scheduler] Onboard tick error:", err.message);
      }
    }, this.config.onboardIntervalMs);
    this.intervals.push(onboardInterval);

    // VTXO renewal check
    const renewalInterval = setInterval(async () => {
      try {
        await this.renewer.tick();
      } catch (err: any) {
        console.error("[Scheduler] Renewal tick error:", err.message);
      }
    }, this.config.renewalIntervalMs);
    this.intervals.push(renewalInterval);

    // Run onboarder once immediately
    this.onboarder.tick().catch(() => {});

    console.log(
      `[Scheduler] Onboard: every ${this.config.onboardIntervalMs / 1000}s, ` +
      `Renewal: every ${this.config.renewalIntervalMs / 1000}s`
    );
  }

  stop(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
    console.log("[Scheduler] Stopped.");
  }
}
