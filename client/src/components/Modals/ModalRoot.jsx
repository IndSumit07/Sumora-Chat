import { useUIStore } from '../../store/uiStore.js';
import { MODAL_TYPES } from '../../utils/constants.js';
import CreateGroupModal from './CreateGroupModal.jsx';
import AddFriendModal from './AddFriendModal.jsx';
import MediaPreviewModal from './MediaPreviewModal.jsx';

export default function ModalRoot() {
  const { activeModal, closeModal, modalData, mediaPreview } = useUIStore();

  if (!activeModal && !mediaPreview) return null;

  return (
    <>
      {activeModal === MODAL_TYPES.CREATE_GROUP && <CreateGroupModal isOpen onClose={closeModal} />}
      {activeModal === MODAL_TYPES.ADD_FRIEND && <AddFriendModal isOpen onClose={closeModal} />}
      
      {/* Handled via special mediaPreview state so it can be layered */}
      {mediaPreview && <MediaPreviewModal />}
    </>
  );
}
