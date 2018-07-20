import * as React from 'react';
import { AllowanceStateView } from 'ts/components/ui/allowance_state_view';

export interface AllowanceStateToggleProps {}

const flip = () => Math.random() < 0.5;

export const AllowanceStateToggle: React.StatelessComponent<AllowanceStateToggleProps> = () => (
    <AllowanceStateView allowanceState={flip() ? 'locked' : 'unlocked'} />
);
