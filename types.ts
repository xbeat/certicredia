import React from 'react';

export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum UserType {
  SPECIALIST = 'SPECIALIST',
  COMPANY = 'COMPANY'
}