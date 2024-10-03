module aptos_document_management::document_management {
    // Import necessary modules from the Aptos framework and standard library
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::timestamp;
    use aptos_std::simple_map::{Self, SimpleMap};
    use std::error;
    use std::signer;
    use std::string::{Self, utf8, String};
    use std::vector::{Self};

    // Define a constant seed for object creation
    const SEED: vector<u8> = b"document_management";

    // Define error codes for various scenarios
    const NOT_EXIST: u64 = 1;
    const NOT_AUTHORIZED: u64 = 2;
    const ALREADY_SIGNED: u64 = 3;
    const NOT_ALLOWED_TO_SIGN: u64 = 4;
    const DOCUMENT_ALREADY_EXISTS: u64 = 5;

    // Define the main Document struct to store document information
    struct Document has store, drop, copy {
        id: String,
        name: String,
        ipfs_hash: String,
        created_at: u64,
        signatures: vector<address>,
        owner: address,
        url: String,
        users_to_sign: vector<address>,
    }

    // Define event structs for various document-related actions
    struct CreatedDocumentEvent has store, drop {
        id: String,
        name: String,
        ipfs_hash: String,
        created_at: u64,
        owner: address,
        url: String,
    }

    struct DocumentSignedEvent has store, drop {
        id: String,
        signer: address,
    }

    struct DocumentDeletedEvent has store, drop {
        id: String,
    }

    struct DocumentSignerAddedEvent has store, drop {
        id: String,
        signer: address,
    }

    // Define the main state struct to store all documents
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct DocumentState has key {
         documents: vector<Document>,
         documents_map: SimpleMap<String, Document>,
    }

    // Define a struct to store event handles
    struct ModuleEventStore has key {
        created_document_events: event::EventHandle<CreatedDocumentEvent>,
        document_signed_events: event::EventHandle<DocumentSignedEvent>,
        document_deleted_events: event::EventHandle<DocumentDeletedEvent>,
        document_signer_added_event: event::EventHandle<DocumentSignerAddedEvent>,
    }

    // Initialize the module
    fun init_module(account: &signer) {
        let constructor_ref = object::create_named_object(account, SEED);
        let object_signer = &object::generate_signer(&constructor_ref);

        // Create and store the event handles
        let module_event_store = ModuleEventStore {
            created_document_events: account::new_event_handle(account),
            document_signed_events: account::new_event_handle(account),
            document_deleted_events: account::new_event_handle(account),
            document_signer_added_event: account::new_event_handle(account),
        };

        // Initialize the document state
        let document_state = DocumentState {
            documents: vector[],
            documents_map: simple_map::new<String, Document>()
        };
        move_to(object_signer, document_state);
        move_to(object_signer, module_event_store);
    }

    // Add a user to the list of signers for a document
    public entry fun addUserToSign(account: &signer, id: String, user: address) acquires DocumentState, ModuleEventStore {
        let (document_state, event_store) = FlexibleAuthorized();
        let document = simple_map::borrow_mut(&mut document_state.documents_map, &id);
        let (_, i) = vector::index_of(&document_state.documents, document);
        let array_document = vector::borrow_mut(&mut document_state.documents, i);
        assert_is_owner(document, account);
        assert_is_owner(array_document, account);
        if(!vector::contains(&array_document.users_to_sign, &user)) vector::push_back(&mut array_document.users_to_sign, user);
        if(!vector::contains(&document.users_to_sign, &user)) vector::push_back(&mut document.users_to_sign, user);

        // Emit an event for adding a signer
        event::emit_event(&mut event_store.document_signer_added_event, DocumentSignerAddedEvent {
            id,
            signer: user
        });
    }

    // Create a new document
    public entry fun CreateDocument(account: &signer, name: String, ipfs_hash: String, id: String, url: String) acquires DocumentState, ModuleEventStore {
        let (document_state, event_store) = FlexibleAuthorized();
        
        // Check if the document with the given id already exists
        assert!(!simple_map::contains_key(&document_state.documents_map, &id), error::already_exists(DOCUMENT_ALREADY_EXISTS));
        
        let document = Document {
            id,
            name,
            ipfs_hash,
            created_at: timestamp::now_seconds(),
            signatures: vector[],
            owner: signer::address_of(account),
            url,
            users_to_sign: vector[signer::address_of(account)]
        };
        vector::push_back(&mut document_state.documents, document);
        simple_map::add(&mut document_state.documents_map, id, document);

        // Emit an event for document creation
        event::emit_event(&mut event_store.created_document_events, CreatedDocumentEvent {
            id,
            name,
            ipfs_hash,
            created_at: timestamp::now_seconds(),
            owner: signer::address_of(account),
            url,
        });
    }

    // Sign a document
    public entry fun SignDocument(account: &signer, id: String) acquires DocumentState, ModuleEventStore {
        let (document_state, event_store) = FlexibleAuthorized();
        let document = simple_map::borrow_mut(&mut document_state.documents_map, &id);
        let signer_address = signer::address_of(account);

        let (_, i) = vector::index_of(&document_state.documents, document);
        let array_document = vector::borrow_mut(&mut document_state.documents, i);
        
        // Check if the signer is allowed to sign and hasn't already signed
        assert_allowed_to_sign(document, signer_address);
        assert_not_already_signed(document, signer_address);

        assert_allowed_to_sign(array_document, signer_address);
        assert_not_already_signed(array_document, signer_address);

        vector::push_back(&mut array_document.signatures, signer_address);
        vector::push_back(&mut document.signatures, signer_address);

        // Emit an event for document signing
        event::emit_event(&mut event_store.document_signed_events, DocumentSignedEvent {
            id,
            signer: signer_address
        });
    }

    // Delete a document
    public entry fun DeleteDocument(account: &signer, id: String) acquires DocumentState, ModuleEventStore {
        let (document_state, event_store) = FlexibleAuthorized();
        let document = simple_map::borrow(&document_state.documents_map, &id);
        assert_is_owner(document, account);
        
        let (_, i) = vector::index_of(&document_state.documents, document);
        vector::remove(&mut document_state.documents, i);
        simple_map::remove(&mut document_state.documents_map, &id);

        // Emit an event for document deletion
        event::emit_event(&mut event_store.document_deleted_events, DocumentDeletedEvent {
            id
        });
    }

    // View function to get all documents
    #[view]
    public fun getAllDocuments(user: address): vector<Document> acquires DocumentState, ModuleEventStore {
        let (document_state, _) = FlexibleAuthorized();
        let documents = document_state.documents;
        let documents_to_sign = vector[];
        let i = 0;
        while (i < vector::length(&documents)) {
            let document = vector::borrow(&documents, i);
            if (vector::contains(&document.users_to_sign, &user)) vector::push_back(&mut documents_to_sign, *document);
            i = i + 1;
        };
        documents_to_sign
    }

    // View function to get a specific document by ID
    #[view]
    public fun getDocumentById(id: String): Document acquires DocumentState, ModuleEventStore {
        let (document_state, _) = FlexibleAuthorized();
        let document = simple_map::borrow(&document_state.documents_map, &id);
        *document
    }
    
    // View function to check if a document is signed by a specific address
    #[view]
    public fun isDocumentSigned(id: String, signer_address: address): bool acquires DocumentState, ModuleEventStore {
        let (document_state, _) = FlexibleAuthorized();
        let document = simple_map::borrow(&document_state.documents_map, &id);
        vector::contains(&document.signatures, &signer_address)
    }
    
    // View function to get all signers of a document
    #[view]
    public fun getDocumentSigners(id: String): vector<address> acquires DocumentState, ModuleEventStore {
        let (document_state, _) = FlexibleAuthorized();
        let document = simple_map::borrow(&document_state.documents_map, &id);
        document.signatures
    }


    // Helper function to authorize access and return immutable reference to state
    inline fun FlexibleAuthorized(): (&mut DocumentState, &mut ModuleEventStore) acquires DocumentState {
        let object_address = object::create_object_address(&@aptos_document_management, SEED);
        assert!(exists<DocumentState>(object_address), error::not_found(NOT_EXIST));
        (borrow_global_mut<DocumentState>(object_address), borrow_global_mut<ModuleEventStore>(object_address))
    }


    // Helper function to assert if the account is the owner of the document
    inline fun assert_is_owner(document: &Document, account: &signer) {
        assert!(document.owner == signer::address_of(account), error::permission_denied(NOT_AUTHORIZED));
    }

    // Helper function to assert if the signer is allowed to sign the document
    inline fun assert_allowed_to_sign(document: &Document, signer_address: address) {
        assert!(vector::contains(&document.users_to_sign, &signer_address), error::permission_denied(NOT_ALLOWED_TO_SIGN));
    }

    // Helper function to assert if the signer has not already signed the document
    inline fun assert_not_already_signed(document: &Document, signer_address: address) {
        assert!(!vector::contains(&document.signatures, &signer_address), error::invalid_state(ALREADY_SIGNED));
    }
}