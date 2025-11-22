"use client";

import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
	PromptInputSelect,
	PromptInputSelectContent,
	PromptInputSelectItem,
	PromptInputSelectTrigger,
	PromptInputSelectValue,
	PromptInputSpeechButton,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputFooter,
	PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { CheckIcon, CopyIcon, GlobeIcon, RefreshCcwIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { cn } from '@/lib/utils';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { useHeaderStore } from '@/stores/headerStore';
import { nanoid } from 'nanoid';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import ApprovalCard from '@/components/chat-cards/approval-card';

const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude 4 Opus",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    chef: "Google",
    chefSlug: "google",
    providers: ["google"],
  },
];

export default function ChatPage() {
	const [text, setText] = useState('');
	const [model, setModel] = useState(models[0].id);
	const [useWebSearch, setUseWebSearch] = useState(false);
	const textareaRef = useRef(null);
	const { messages, status, sendMessage, addToolApprovalResponse } = useChat({
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses
	});

	function handleSubmit(message) {
		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);

		if (!(hasText || hasAttachments)) {
			return;
		}

		sendMessage({ text });

		setText('');
	};

	return (
		<div className='flex justify-center h-full'>
			<div className="flex flex-col justify-center h-full w-3xl">

				{
					messages.length === 0 && (
						<h2 className={cn("text-foreground text-xl text-center mb-8", ``)}>
							Check out new insights!
						</h2>
					)
				}

				<Conversation className={cn("h-screen", messages.length === 0 && 'flex-0')}>
					<ConversationContent>
						{
							messages.map((message, messageIndex) => {
								return <Message key={message.id} className="flex flex-col" from={message.role}>
									{
										message.parts.map((part, partIndex) => {
											switch (part.type) {
												case 'tool-randomNumber':
													return <ApprovalCard 
														title="Generate random number" 
														body="Would you allow it O Lord?" 
														state={part.state} 
														key={part?.approval?.id || nanoid()} 
														approval={part.approval}
														approve={() => { addToolApprovalResponse({ id: part?.approval?.id || null, approved: true }) }}
														reject={() => { console.log('hi'); addToolApprovalResponse({ id: part?.approval?.id || null, approved: false }) }}
													/>
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
							})
						}
					</ConversationContent>
				</Conversation>

				<PromptInput onSubmit={handleSubmit} className={cn("mt-4")} globalDrop multiple>
					<PromptInputBody>
						<PromptInputTextarea
							onChange={(e) => setText(e.target.value)}
							ref={textareaRef}
							value={text}
						/>
					</PromptInputBody>

					<PromptInputAttachments className="w-full">
						{(attachment) => <PromptInputAttachment data={attachment} />}
					</PromptInputAttachments>
					
					<PromptInputFooter>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>
									<PromptInputActionAddAttachments />
								</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<PromptInputSpeechButton
								onTranscriptionChange={setText}
								textareaRef={textareaRef}
							/>
							<PromptInputButton
								onClick={() => setUseWebSearch(!useWebSearch)}
								variant={useWebSearch ? 'default' : 'ghost'}
							>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
							<PromptInputSelect
								onValueChange={(value) => {
									setModel(value);
								}}
								value={model}
							>
								<PromptInputSelectTrigger>
									<PromptInputSelectValue />
								</PromptInputSelectTrigger>
								<PromptInputSelectContent>
									{models.map((model) => (
										<PromptInputSelectItem key={model.id} value={model.id}>
											{model.name}
										</PromptInputSelectItem>
									))}
								</PromptInputSelectContent>
							</PromptInputSelect>
						</PromptInputTools>

						<PromptInputSubmit disabled={!text && !status} status={status} />
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
};

