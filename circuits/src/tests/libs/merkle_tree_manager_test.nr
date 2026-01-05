//use crate::libs::merkle_tree_manager::{hasher, update_merkle_tree};
//use std::hash::pedersen_hash;


//-------------------------------------------------------------------------//
//    Tests for the hasher() function in the libs/merkle_tree_manager.nr   //  
//-------------------------------------------------------------------------//
mod test_of_hasher_function {
    use crate::libs::merkle_tree_manager::{hasher, update_merkle_tree};
    use std::hash::pedersen_hash;

    /**
    * @notice - Basic functionality test
    */
    #[test]
    fn test_hasher_basic() {
        // @dev - Test the hasher function with two Field elements
        let leaf1: Field = 0x123456;
        let leaf2: Field = 0x789ABC;
        
        let hash = hasher([leaf1, leaf2]);
        
        // Verify it produces a hash (non-zero)
        assert(hash != 0);
        
        // Verify consistency: same inputs produce same output
        let hash2 = hasher([leaf1, leaf2]);
        assert_eq(hash, hash2);
    }

    /**
    * @notice - Verifies consistent output for same inputs
    */
    #[test]
    fn test_hasher_deterministic() {
        // @dev - Verify hasher is deterministic with same inputs
        let leaves: [Field; 2] = [0x111111, 0x222222];
        
        let hash1 = hasher(leaves);
        let hash2 = hasher(leaves);
        let hash3 = hasher(leaves);
        
        assert_eq(hash1, hash2);
        assert_eq(hash2, hash3);
    }

    /**
    * @notice - Verifies different inputs produce different hashes
    */
    #[test]
    fn test_hasher_different_inputs() {
        // @dev - Verify different inputs produce different hashes
        let leaves1: [Field; 2] = [0x1, 0x2];
        let leaves2: [Field; 2] = [0x3, 0x4];
        
        let hash1 = hasher(leaves1);
        let hash2 = hasher(leaves2);
        
        assert(hash1 != hash2);
    }

    /**
    * @notice - Verifies input order affects the hash
    */
    #[test]
    fn test_hasher_order_matters() {
        // @dev - Verify that order of inputs matters
        let leaves1: [Field; 2] = [0x100, 0x200];
        let leaves2: [Field; 2] = [0x200, 0x100];
        
        let hash1 = hasher(leaves1);
        let hash2 = hasher(leaves2);
        
        // Hashes should be different when inputs are in different order
        assert(hash1 != hash2);
    }

    /**
    * @notice - Verifies it correctly uses Pedersen hash
    */
    #[test]
    fn test_hasher_matches_pedersen() {
        // @dev - Verify hasher uses pedersen_hash correctly
        let leaves: [Field; 2] = [0xAABBCC, 0xDDEEFF];
        
        let hash_from_hasher = hasher(leaves);
        let hash_from_pedersen = pedersen_hash(leaves);
        
        // Should match since hasher uses pedersen_hash internally
        assert_eq(hash_from_hasher, hash_from_pedersen);
    }

    /**
    * @notice - Tests hasher with mixed zero and non-zero values
    */
    #[test]
    fn test_hasher_with_mixed_values() {
        // @dev - Test hasher with one zero and one non-zero value
        let leaves1: [Field; 2] = [0, 0x12345];
        let leaves2: [Field; 2] = [0x12345, 0];
        
        let hash1 = hasher(leaves1);
        let hash2 = hasher(leaves2);
        
        // Both should produce valid hashes
        assert(hash1 != 0);
        assert(hash2 != 0);
        
        // And they should be different (order matters)
        assert(hash1 != hash2);
    }
}


//-------------------------------------------------------------------------------------//
//    Tests for the update_merkle_tree() function in the libs/merkle_tree_manager.nr   //  
//-------------------------------------------------------------------------------------//
mod test_of_update_merkle_tree_function {
    use crate::libs::merkle_tree_manager::{hasher, update_merkle_tree};
    use std::hash::pedersen_hash;
    /**
    * @notice - Basic tree update functionality
    */
    #[test]
    fn test_update_merkle_tree_basic() {
        // @dev - Test basic Merkle tree update with single entry
        let entry: Field = 0x12345678;
        let merkle_root: Field = 0; // Initial root
        let paths: [Field; 0] = [];
        
        let new_root = update_merkle_tree(entry, merkle_root, paths);
        
        // Verify new root is non-zero
        assert(new_root != 0);
    }

    /**
    * @notice - Verifies consistent root for same entry
    */
    #[test]
    fn test_update_merkle_tree_deterministic() {
        // @dev - Verify same entry produces same root
        let entry: Field = 0x9876543210;
        let merkle_root: Field = 0;
        let paths: [Field; 0] = [];
        
        let root1 = update_merkle_tree(entry, merkle_root, paths);
        let root2 = update_merkle_tree(entry, merkle_root, paths);
        
        assert_eq(root1, root2);
    }

    /**
    * @notice - Verifies different entries produce different roots
    */
    #[test]
    fn test_update_merkle_tree_different_entries() {
        // @dev - Verify different entries produce different roots
        let entry1: Field = 0x111;
        let entry2: Field = 0x222;
        let merkle_root: Field = 0;
        let paths: [Field; 0] = [];
        
        let root1 = update_merkle_tree(entry1, merkle_root, paths);
        let root2 = update_merkle_tree(entry2, merkle_root, paths);
        
        // Different entries should produce different roots
        assert(root1 != root2);
    }

    /**
    * @notice - Tests update with realistic user balance
    */
    #[test]
    fn test_update_merkle_tree_with_user_balance() {
        // @dev - Test with realistic user balance data
        let user_balance: Field = 1000;
        let initial_root: Field = 0;
        let paths: [Field; 0] = [];
        
        let new_root = update_merkle_tree(user_balance, initial_root, paths);
        
        // Verify function completes and returns a valid root
        assert(new_root != 0);
    }

    /**
    * @notice - Tests update with large Field value
    */
    #[test]
    fn test_update_merkle_tree_with_large_value() {
        // @dev - Test with large Field value
        let large_entry: Field = 0xFFFFFFFFFFFFFFFF;
        let merkle_root: Field = 0;
        let paths: [Field; 0] = [];
        
        let new_root = update_merkle_tree(large_entry, merkle_root, paths);
        
        assert(new_root != 0);
    }

    /**
    * @notice - Tests update with zero entry
    */
    #[test]
    fn test_update_merkle_tree_with_zero_entry() {
        // @dev - Test with zero entry
        let entry: Field = 0;
        let merkle_root: Field = 0;
        let paths: [Field; 0] = [];
        
        let new_root = update_merkle_tree(entry, merkle_root, paths);
        
        // Verify the function completes successfully
        // Note: A zero entry may produce a zero or specific root value
        // The important thing is that the function doesn't fail
        let _ = new_root;
    }

    /**
    * @notice - Tests adding multiple entries sequentially
    */
    #[test]
    fn test_update_merkle_tree_sequential() {
        // @dev - Test adding entries sequentially produces consistent roots
        let entry1: Field = 100;
        let entry2: Field = 200;
        let entry3: Field = 300;
        let paths: [Field; 0] = [];
        
        let root1 = update_merkle_tree(entry1, 0, paths);
        let root2 = update_merkle_tree(entry2, 0, paths);
        let root3 = update_merkle_tree(entry3, 0, paths);
        
        // Each should produce a different root
        assert(root1 != root2);
        assert(root2 != root3);
        assert(root1 != root3);
    }

    /**
    * @notice - Tests hasher with zero values
    */
    #[test]
    fn test_hasher_with_zero_values() {
        // @dev - Test hasher with zero values
        let leaves: [Field; 2] = [0, 0];
        let hash = hasher(leaves);
        
        // Should produce a valid hash even for zero inputs
        assert(hash != 0);
    }

    /**
    * @notice - Tests update with identical entries
    */
    #[test]
    fn test_update_merkle_tree_consistency() {
        // @dev - Test that the same entry at index 0 always produces the same root
        let entry: Field = 0xABCDEF123456;
        let paths: [Field; 0] = [];
        
        // Create multiple trees with same entry
        let root_a = update_merkle_tree(entry, 0, paths);
        let root_b = update_merkle_tree(entry, 0, paths);
        let root_c = update_merkle_tree(entry, 0, paths);
        
        // All should be identical
        assert_eq(root_a, root_b);
        assert_eq(root_b, root_c);
    }
}