'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useChat } from "ai/react"
import { useRef, useEffect, useState } from 'react'
import { Select } from "@/components/ui/select" // Import your Select component
import zeotapLogo from './zeotap_logo.svg'; 
import zeotapLogo1 from './download.jpeg'; 

export function Chat2() {
    const apiOptions = [
        { value: 'api/ex41', label: 'Segment 1.1' },
        { value: 'api/ex42', label: 'Segment 1.2' },
        { value: 'api/ex43', label: 'Segment 1.3' },
        { value: 'api/ex44', label: 'Segment 1.4' },
        { value: 'api/ex5', label: 'mParticle' },
        { value: 'api/ex61', label: 'Lytics 1.1' },
        { value: 'api/ex62' , label: 'Lytics 1.2'},
        { value: 'api/ex7', label: 'Zeotap' },
    ];
    // const apiOptions = ['api/ex4', 'api/ex5', 'api/ex6', 'api/ex7'];
    const [selectedApi, setSelectedApi] = useState(apiOptions[0].value); // Default to Segment
    // const [selectedApi, setSelectedApi] = useState(apiOptions[0]); // Default to api/ex4

    const { messages, input, handleInputChange, handleSubmit } = useChat({
        api: selectedApi,
        onError: (e) => {
            console.log(e)
        }
    })
    const chatParent = useRef<HTMLUListElement>(null)

    useEffect(() => {
        const domNode = chatParent.current
        if (domNode) {
            domNode.scrollTop = domNode.scrollHeight
        }
    })

    return (
        <main className="flex flex-col w-full h-screen max-h-dvh bg-background">

            <header className="p-4 border-b w-full max-w-3xl mx-auto flex justify-between items-center"> {/* Added flex and justify-between */}
                <h1 className="text-2xl font-bold">Zeotap Bot</h1>
                <img src={zeotapLogo.src} alt="Zeotap Logo" className="h-8 w-auto" /> {/* Added logo image */}
            </header>

            <section className="p-4">
                <form onSubmit={handleSubmit} className="flex w-full max-w-3xl mx-auto items-center">
                    <Input className="flex-1 min-h-[40px]" placeholder="Type your question here..." type="text" value={input} onChange={handleInputChange} />
                    <Select
                        className="ml-2" 
                        value={selectedApi}
                        onChange={(e) => setSelectedApi(e.target.value)}
                    >
                        {apiOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <Button className="ml-2" type="submit">
                        Submit
                    </Button>
                </form>
            </section>

            <section className="container px-0 pb-10 flex flex-col flex-grow gap-4 mx-auto max-w-3xl">
                <ul ref={chatParent} className="h-1 p-4 flex-grow bg-muted/50 rounded-lg overflow-y-auto flex flex-col gap-4">
                    {messages.map((m, index) => (
                        <div key={index}>
                            {m.role === 'user' ? (
                                <li key={m.id} className="flex flex-row">
                                    <div className="rounded-xl p-4 bg-background shadow-md flex">
                                        <p className="text-primary">{m.content}</p>
                                    </div>
                                </li>
                            ) : (
                                <li key={m.id} className="flex flex-row-reverse">
                                    <div className="rounded-xl p-4 bg-background shadow-md flex w-3/4">
                                        <p className="text-primary">{m.content}</p>
                                    </div>
                                </li>
                            )}
                        </div>
                    ))}
                </ul>
            </section>
        </main>
    )
}