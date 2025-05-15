import React from 'react';
import { Button } from './components/ui/button.jsx';

export default function TestButton() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Button Test</h2>
      <div className="flex flex-col gap-4">
        <Button variant="default">Default Button</Button>
        <Button variant="destructive">Destructive Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="link">Link Button</Button>
      </div>
    </div>
  );
}
