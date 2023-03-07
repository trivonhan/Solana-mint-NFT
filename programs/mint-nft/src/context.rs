use anchor_lang::{
    prelude::*,
    system_program::System,
};

use crate::instruction;
use crate::{
    state::*,
    constant::*,
};

#[derive(Accounts)]
pub struct CreateMintAccountContext<'info> {
    
    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMintContext<'info> {
    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
    
}

#[derive(Accounts)]
pub struct CreateAssociatedTokenAccountContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Associated token account init before
    #[account(mut)]
    pub associated_token: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Token program ID of Associated token program
    pub associated_token_program: AccountInfo<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MintToContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    /// CHECK: Associated token account of user
    #[account(mut)]
    pub token_account: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreateMetadataAccountsContext<'info> {

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Mint account according to user
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub update_authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

}

#[derive(Accounts)]
pub struct CreateMasterEditionAccountContext<'info> {
    
    /// CHECK: Master edition account
    #[account(mut)]
    pub master_edition_account: AccountInfo<'info>,

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Mint account according to user
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreatePrintEditionContext<'info> {

    /// CHECK: Metadata account of edition (pda of ['metadata', program id, mint id])
    #[account(mut)]
    pub edition_metadata_account: AccountInfo<'info>,

    /// CHECK: Edition account (pda of ['metadata', program id, mint id, 'edition'])
    #[account(mut)]
    pub edition_account: AccountInfo<'info>,

    /// CHECK: Master edition account (pda of ['metadata', program id, mint id, 'edition'])
    #[account(mut)]
    pub master_edition_account: AccountInfo<'info>,

    /// CHECK: Mint of new edition token 
    #[account(mut)]
    pub edition_mint: AccountInfo<'info>,

    /// CHECK: Edition pda to mark creation - will be checked for pre-existence.
    /// (pda of ['metadata', program id, master metadata mint id, 'edition', edition_number])
    /// edition_number is NOT the edition number you pass in args but actually 
    /// edition_number = floor(edition/EDITION_MARKER_BIT_SIZE).
    #[account(mut)]
    pub edition_mark_pda: AccountInfo<'info>,

    /// CHECK: Mint authority of new edition mint
    #[account(mut)]
    pub edition_mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Owner of token account containing master edition token
    #[account(mut)]
    pub token_account_owner: Signer<'info>,

    /// CHECK: Token account containing token from master metadata mint
    #[account(mut)]
    pub token_account: AccountInfo<'info>,

    /// CHECK: Update authority of edition account
    #[account(mut)]
    pub edition_update_authority: Signer<'info>,

    /// CHECK: Master record metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: I don't know what this is
    #[account(mut)]
    pub metadata_mint: AccountInfo<'info>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    
    pub rent: Sysvar<'info, Rent>,
}

// #[derive(Accounts)]
// pub struct ComputeEditionMarkPda<'info> {
//     #[account]

// }