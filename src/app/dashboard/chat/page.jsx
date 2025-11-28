"use client";

import { PromptInput, PromptInputActionAddAttachments, PromptInputActionMenu, PromptInputActionMenuContent, PromptInputActionMenuTrigger, PromptInputAttachment, PromptInputAttachments, PromptInputBody, PromptInputButton, PromptInputSelect, PromptInputSelectContent, PromptInputSelectItem, PromptInputSelectTrigger, PromptInputSelectValue, PromptInputSpeechButton, PromptInputSubmit, PromptInputTextarea, PromptInputFooter, PromptInputTools } from '@/components/ai-elements/prompt-input';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { GlobeIcon} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useTeamStore } from '@/stores/teamStore';
import { useChat } from '@ai-sdk/react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { cn } from '@/lib/utils';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { createClient } from "@/scripts/supabase/client";
import ApprovalCard from '@/components/chat-cards/approval-card';
import { Bar, BarChart } from 'recharts';
import PlaceholderInput from '../../../components/placeholders-and-vanish-input.jsx';
import { motion } from 'motion/react';
import { signInWithGoogle } from "../../sign-in/actions";
import Logo from "@/components/logo/logo";
import GoogleLoginButton from "@/components/buttons/google-login";
import { toast, Toaster } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const models = [
	{
	  id: "openai/gpt-5-nano",
	  name: "GPT-5 Nano",
	},
	{
	  id: "anthropic/claude-haiku-4.5",
	  name: "Claude Haiku 4.5",
	},
	{
		id: "minimax/minimax-m2",
		name: "MiniMax M2",
	},
  {
    id: "meituan/longcat-flash-chat",
    name: "Flash Chat",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
  },
  {
    id: "xai/grok-4-fast-reasoning",
    name: "Grok 4 Fast Reasoning",
  },
];

export default function ChatPage() {
	const [inputText, setInputText] = useState('');
	const [model, setModel] = useState(models[0].id);
	const [useWebSearch, setUseWebSearch] = useState(false);
	const [isPendingMessage, setIsPendingMessage] = useState(false);

	const textareaRef = useRef(null);

	const { messages, status, error, sendMessage, addToolApprovalResponse, clearError } = useChat({ 
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses
	});

	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		(async () => {
		const supabase = createClient();

		const metadata = await supabase.auth.getUser();

		setIsAuthenticated(!!metadata.data.user);
		console.log(metadata.data.user);
		})();
	}, []);

	function handleGoogle() {
		signInWithGoogle();

		toast('Пожалуйста, подождите...', { position: 'top-center'});
	}

	console.log(messages, status, String(error));

	useEffect(() => {
		// Automatically clears AI schema validation errors. 
		// Possibly caused by beta_AI-SDK/V6 'finish' chunk injections.

		if (!error) return;

		try {
			const errorName = error?.name ?? error?.constructor?.name;
			if (errorName === 'AI_TypeValidationError') {
				clearError?.();
			}
		} catch (error) {
			// swallow any inspector errors and continue
			console.warn('Failed to inspect AI error', error);
		}
	}, [error, clearError]);

	// Prevent page scrolling while this route is mounted so only the conversation can scroll.
	useEffect(() => {
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = prevOverflow; };
	}, []);

	useEffect(() => {
		setIsPendingMessage(false);
	}, [messages]);

	function handleSubmit(message) {
		console.log(inputText);
		console.log(message);

		setIsPendingMessage(true);

		toast('В Бригантине медленный интернет, так что ответ займёт больше времени, чем обычно', { position: 'top-center'});

		if (inputText.trim().length === 0) {
			return;
		}
		
		sendMessage({ text: inputText });

		setInputText('');
	};

	return (
		// Full viewport container (no page scrolling) - only messages will scroll
		<div className='flex justify-center h-screen px-2 overflow-hidden'>
			<header className="border backdrop-saturate-200 border-white/10 rounded-2xl flex flex-row justify-between p-2 align-middle fixed z-50 backdrop-blur-md inset-x-2 sm:inset-x-0 sm:mx-auto max-w-2xl">
				<Logo className="ml-2 my-auto translate-y-[2px] shadow-xs"/>

				<Toaster theme="dark" />

				{ isAuthenticated === false && <AlertDialog>
					<AlertDialogTrigger>
					<div className="border border-white/15 rounded-xl py-2 px-4">
						Оповестить о релизе
					</div>
					</AlertDialogTrigger>
					<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Подписаться на релиз</AlertDialogTitle>
						<AlertDialogDescription>
						Для этого нужно зарегистрироваться
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="font-normal mt-1">Закрыть</AlertDialogCancel>
						<GoogleLoginButton onClick={handleGoogle}/>
					</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				}
			</header>
			
			{/* flex column that fills the available height; using min-h-0 lets children (Conversation) scroll */}
			<div className="flex flex-col justify-center h-full w-full max-w-3xl min-h-0">

				{
					// Show a welcome message when there are no messages yet
					messages.length === 0 && (
						<h2 className={cn("text-foreground text-3xl text-center mb-8", ``)}>
							Что вас интересует?
						</h2>
					)
				}

				{/* Conversation is set to flex-1 within its component; ensure it can grow & scroll */}
				<Conversation className={cn("h-full flex-1 min-h-0", messages.length === 0 && 'flex-0')}>
					<div className='mt-24'/>
					<ConversationContent className="w-full">
						<span className='text-muted-foreground pb-6 text-center'>[прототип]</span>
						{
							messages.map((message) => {
								return <motion.div layout key={message.id}  initial={{y: -10, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{type: 'spring', stiffness: 300, damping: 20}}>
									<Message className="flex flex-col" from={message.role}>
									{
										message.parts.map((part, partIndex) => {
											switch (part.type) {
												case 'tool-scrapeURL':
													return <Tool key={`${message.id}-${partIndex}-${part.type}`}>
														<ToolHeader type="Test" state={part.state}>
															Scraping URL
														</ToolHeader>
														<ToolContent>
															<ToolInput input={part.input}/>
															<ToolOutput output={part.output} errorText={part.errorText}/>
														</ToolContent>
													</Tool>

												case 'tool-search':
													return <Tool key={`${message.id}-${partIndex}-${part.type}`}>
														<ToolHeader type="Search" state={part.state}>
															Web Search
														</ToolHeader>
														<ToolContent>
															<ToolInput input={part.input} />

															{
																part.output && part.output.web && Array.isArray(part.output.web) ? (
																	<div className="space-y-2 p-4">
																		<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Results</h4>
																		<div className="rounded-md bg-muted/50 p-2">
																			{part.output.web.map((hit, idx) => (
																				<div key={idx} className="mb-3">
																					<a href={hit.url || hit.link || '#'} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">
																						{hit.title || hit.name || hit.url || hit.link}
																					</a>
																					{hit.snippet || hit.excerpt || hit.description ? (
																						<div className="text-xs text-muted-foreground mt-1">{hit.snippet || hit.excerpt || hit.description}</div>
																					) : null}
																					{hit.domain && <div className="text-xs text-muted-foreground mt-1">{hit.domain}</div>}
																				</div>
																			))}
																		</div>
																	</div>
																) : (
																	<ToolOutput output={part.output} errorText={part.errorText} />
																)
															}
														</ToolContent>
													</Tool>

												case 'tool-mapURL':
													return <Tool key={`${message.id}-${partIndex}-${part.type}`}>
														<ToolHeader type="Map" state={part.state}>
															Map URL
														</ToolHeader>
														<ToolContent>
															<ToolInput input={part.input} />
															<ToolOutput output={part.output} errorText={part.errorText} />
														</ToolContent>
													</Tool>

												case 'tool-crawlURL':
													return <Tool key={`${message.id}-${partIndex}-${part.type}`}>
														<ToolHeader type="Crawl" state={part.state}>
															Crawl URL
														</ToolHeader>
														<ToolContent>
															<ToolInput input={part.input} />
															{
																// If crawl returns an array of pages in `output.web` or `output.pages`, render them nicely
																part.output && (Array.isArray(part.output.web) || Array.isArray(part.output.pages)) ? (
																	<div className="space-y-2 p-4">
																		<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Pages</h4>
																		<div className="rounded-md bg-muted/50 p-2">
																			{(part.output.web || part.output.pages).map((page, idx) => (
																				<div key={idx} className="mb-3">
																					<a href={page.url || page.link || '#'} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">
																						{page.title || page.url || page.link}
																					</a>
																					{page.excerpt && <div className="text-xs text-muted-foreground mt-1">{page.excerpt}</div>}
																				</div>
																			))}
																		</div>
																	</div>
																) : (
																	<ToolOutput output={part.output} errorText={part.errorText} />
																)
															}
														</ToolContent>
													</Tool>

												case 'reasoning':
													return (<Reasoning key={`${message.id}-${partIndex}-${part.type}`} isStreaming={part.state === 'streaming'}>
														<ReasoningTrigger />
														<ReasoningContent>{part.text}</ReasoningContent>
													</Reasoning>);

												case 'text':
													return (<MessageContent key={`${message.id}-${partIndex}-${part.type}`}>
														<MessageResponse>{part.text}</MessageResponse>
													</MessageContent>);
											}
										})
									}

								</Message>
								{/* <div className='h-12'/> */}
								</motion.div>
							})
						}
						{
							status === 'submitted' && <div className='w-full h-fit'>
								<div className='text-muted-foreground'>Ответ генерируется...</div>
							</div>
						}
					</ConversationContent>

					<ConversationScrollButton />
				</Conversation>

				<motion.div layout>
					<PlaceholderInput className="mb-12" placeholders={['Найди паттерны', 'Найди аномалии', 'Почему мы теряем пользователей?', 'Почему подписку не покупают?', 'Как заработать больше денег?', 'Что не так?', 'Что ты умеешь?']} onChange={(event) => setInputText(event.target.value)} onSubmit={(text) => handleSubmit(text)}/>
				</motion.div>
			</div>
		</div>
	);
};

