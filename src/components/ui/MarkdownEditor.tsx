import { useState, useRef } from 'react';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { Bold, Italic, Link as LinkIcon, List, Heading1, Heading2 } from 'lucide-react';
// import { cn } from '../../lib/utils';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 10 }: MarkdownEditorProps) {
    const [view, setView] = useState<'write' | 'preview'>('write');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertSyntax = (syntax: string, wrap = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = '';
        let newCursorPos = 0;

        if (wrap) {
            newText = text.substring(0, start) + syntax + selectedText + syntax + text.substring(end);
            newCursorPos = start + syntax.length + selectedText.length + syntax.length;
        } else {
            // Line start syntax like # or -
            newText = text.substring(0, start) + syntax + selectedText + text.substring(end);
            newCursorPos = start + syntax.length + selectedText.length;
        }

        onChange(newText);
        // Restore focus
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div className="border rounded-md bg-background flex flex-col">
            <div className="flex items-center justify-between border-b p-2 bg-muted/40">
                <div className="flex items-center space-x-1">
                    {/* ... (buttons irrelevant to bg) ... */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertSyntax('**', true)}
                        title="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertSyntax('*', true)}
                        title="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-2" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertSyntax('# ')}
                        title="Heading 1"
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertSyntax('## ')}
                        title="Heading 2"
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-2" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertSyntax('- ')}
                        title="Bulleted List"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertSyntax('[Link Text](url)', false)}
                        title="Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex bg-muted rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setView('write')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'write' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('preview')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'preview' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {view === 'write' ? (
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className="border-0 focus-visible:ring-0 rounded-none resize-none p-4 bg-transparent"
                />
            ) : (
                <div
                    className="p-4 prose max-w-none overflow-y-auto"
                    style={{ height: rows * 24 + 'px' }} // Approx height matching rows
                >
                    {/* Basic fake preview renderer */}
                    {value ? (
                        <div className="whitespace-pre-wrap font-sans text-sm">
                            {value.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-2">{line.substring(2)}</h1>;
                                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mb-2">{line.substring(3)}</h2>;
                                if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.substring(2)}</li>;
                                return <p key={i} className="min-h-[1.2em]">{line}</p>;
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">Nothing to preview</p>
                    )}
                </div>
            )}
        </div>
    );
}