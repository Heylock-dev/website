import { Confirmation, ConfirmationAccepted, ConfirmationActions, ConfirmationAction, ConfirmationRejected, ConfirmationRequest, ConfirmationTitle } from '@/components/ai-elements/confirmation';
import { CheckIcon, XIcon } from 'lucide-react';

export default function ApprovalCard({ state, title, body, approval, approve, reject, approvedText, rejectedText }) {
	return (
		<Confirmation approval={approval} state={state} className="mb-4">
			<ConfirmationTitle>
				<ConfirmationRequest>
					<h3 className='font-medium text-foreground'>{title}</h3>
					<span className='text-muted-foreground mt-2 block'>{body}</span>
				</ConfirmationRequest>
				
				<ConfirmationAccepted className="flex">
					<CheckIcon className="size-4 text-green-600 dark:text-green-400 inline" />
					<span className='ml-4'>{approvedText || "You approved this tool execution"}</span>
				</ConfirmationAccepted>

				<ConfirmationRejected className="flex">
					<XIcon className="size-4 text-destructive inline" />
					<span className='ml-4'>{rejectedText || "You rejected this tool execution"}</span>
				</ConfirmationRejected>
			</ConfirmationTitle>

			<ConfirmationActions>
				<ConfirmationAction
					onClick={reject}
					variant="outline"
				>
					Reject
				</ConfirmationAction>

				<ConfirmationAction
					onClick={approve}
					variant="default"
				>
					Approve
				</ConfirmationAction>
			</ConfirmationActions>
		</Confirmation>
	);
}