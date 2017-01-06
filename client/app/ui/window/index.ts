import { WindowService } from './window.service';
import { ConfigurationService } from '../../common/configuration/configuration.service';
import { ModalContainerComponent } from './modal-container.component';
import { ContentComponent} from './window.model';

export { WindowService } from './window.service';
export { ConfigurationService} from '../../common/configuration/configuration.service';
export { ModalContainerComponent} from './modal-container.component';
export { ContentComponent } from './window.model';

export const DECLARATION: any[] = [
	ModalContainerComponent
];

export const PROVIDER: any[] = [
	WindowService,
	ConfigurationService
];