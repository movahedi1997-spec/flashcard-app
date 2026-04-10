'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  mode: 'create' | 'edit';
}

export default function BoxForm({ open, onClose, onSubmit, initialName = '', mode }: Props) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Box name cannot be empty.'); return; }
    onSubmit(name.trim());
    setName('');
    setError('');
    onClose();
  }

  function handleClose() {
    setName(initialName);
    setError('');
    onClose();
  }

  if (open && name !== initialName && mode === 'edit') {
    setName(initialName);
  }

  return (
    <Modal open={open} onClose={handleClose} title={mode === 'create' ? 'New Box' : 'Rename Box'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Box name"
          placeholder="e.g. Spanish Vocabulary"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit">{mode === 'create' ? 'Create Box' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}
